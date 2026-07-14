"""Global Mind Maps: first-class objects seeded from a research question, a
manuscript, or a collection of saved papers. Each node carries a "why this
paper is here" explanation; edge color encodes provenance, style encodes the
relation. Gap analysis runs in manuscript mode."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from .. import tasks
from ..config import settings
from ..db import SessionLocal, get_db
from ..models import Manuscript, MindMap, Reference, SavedPaper
from ..services import claude, s2
from .browse import _search_university

router = APIRouter()

MAX_FIRST_RENDER = 20


class CreateBody(BaseModel):
    seed_type: str  # question | manuscript | collection
    question: str | None = None
    manuscript_id: str | None = None
    paper_ids: list[str] | None = None  # SavedPaper ids
    title: str | None = None


def _mindmap_out(m: MindMap, with_graph: bool = True) -> dict:
    out = {
        "id": m.id, "title": m.title, "seed_type": m.seed_type,
        "seed_ref": m.seed_ref or {}, "status": m.status, "error": m.error,
        "saved": bool(m.saved),
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }
    if with_graph:
        out["graph"] = m.graph
    else:
        g = m.graph or {}
        out["n_nodes"] = len(g.get("nodes", []))
    return out


def _paper_node(p: dict, why: str | None = None) -> dict:
    return {
        "id": p["corpus_id"], "label": p["title"][:110], "type": "paper",
        "source_scope": p["source_scope"], "year": p.get("year"),
        "why": why,
        "meta": {
            "tldr": p.get("tldr") or (p.get("abstract") or "")[:260],
            "citation_count": p.get("citation_count"),
            "venue": p.get("venue"), "url": p.get("url"),
            "authors": p.get("authors", [])[:4],
            "collection": p.get("collection"),
        },
    }


def _cluster_and_explain(seed_label: str, papers: list[dict]) -> dict:
    """One Claude call: clusters + one-line 'why this paper is here' each."""
    listing = "\n".join(
        f"- id={p['corpus_id']} :: {p['title']} ({p.get('year')}) :: "
        f"{(p.get('tldr') or p.get('abstract') or '')[:200]}"
        for p in papers
    )
    return claude.complete_json(
        f"Research seed: {seed_label}\n\nPAPERS:\n{listing}\n\n"
        "Group these papers into 3-5 thematic clusters and explain each paper's "
        "connection to the seed. Return JSON:\n"
        "{\"clusters\": [{\"label\": \"short theme\", \"paper_ids\": [ids]}],\n"
        " \"papers\": [{\"id\": id, \"why\": \"one sentence: why this paper belongs "
        "here, mentioning its specific angle\"}]}",
        max_tokens=3500,
    )


def _dedup(papers: list[dict]) -> list[dict]:
    seen, out = set(), []
    for p in papers:
        key = (p.get("doi") or (p.get("title") or "").lower()[:80])
        if key and key not in seen:
            seen.add(key)
            out.append(p)
    return out


def _retrieve_public(query: str, limit: int, seed_ids: list[str] | None = None) -> list[dict]:
    papers = []
    if seed_ids:
        try:
            papers = s2.recommendations(seed_ids, limit=limit)
        except Exception:
            papers = []
    if len(papers) < limit // 2:
        for q in (query[:250], query[:90]):  # retry with a shorter query
            try:
                extra = s2.search(q, limit=limit)
                known = {p["corpus_id"] for p in papers}
                papers += [p for p in extra if p["corpus_id"] not in known]
                break
            except Exception:
                continue
    return papers


def run_generate(task_id: str, map_id: str):
    db = SessionLocal()
    try:
        m = db.get(MindMap, map_id)
        seed = m.seed_ref or {}
        center = {"id": "center", "type": "center", "source_scope": "derived",
                  "label": m.title[:110], "why": None, "meta": {}}
        cited_ids: set[str] = set()
        papers: list[dict] = []

        tasks.update(task_id, step="Retrieving papers (public + university)", progress=15)
        if m.seed_type == "question":
            q = seed.get("question", m.title)
            papers = _retrieve_public(q, 14)
            try:
                papers += _search_university(q[:250], limit=5)
            except Exception:
                pass

        elif m.seed_type == "manuscript":
            ms = db.get(Manuscript, seed.get("manuscript_id"))
            if not ms:
                tasks.fail(task_id, "manuscript not found")
                return
            center = {"id": "center", "type": "center", "source_scope": "manuscript",
                      "label": ms.title[:110], "why": None, "meta": {}}
            insight = ms.insight or {}
            q = ms.title
            if insight.get("keywords"):
                q = f"{ms.title} {' '.join(insight['keywords'][:5])}"
            verified = (db.query(Reference)
                        .filter_by(manuscript_id=ms.id, status="verified")
                        .limit(15).all())
            cited_ids = {r.corpus_id for r in verified if r.corpus_id}
            # The manuscript's own (verified) citations become nodes too, so
            # solid 'cites' edges exist and gap analysis is discriminating.
            for r in verified[:6]:
                meta = r.resolved_meta or {}
                if not r.corpus_id:
                    continue
                papers.append({
                    "corpus_id": r.corpus_id,
                    "title": meta.get("title") or r.title,
                    "abstract": "", "tldr": None,
                    "year": meta.get("year") or r.year,
                    "venue": meta.get("venue") or "",
                    "citation_count": meta.get("citation_count"),
                    "authors": r.authors or [], "doi": None,
                    "url": meta.get("url"), "source_scope": "public",
                })
            papers += _retrieve_public(q, 10, seed_ids=list(cited_ids)[:10])
            try:
                papers += _search_university(q[:250], limit=5)
            except Exception:
                pass

        elif m.seed_type == "collection":
            rows = (db.query(SavedPaper)
                    .filter(SavedPaper.tenant_id == settings.tenant_id,
                            SavedPaper.id.in_(seed.get("paper_ids") or []))
                    .all())
            papers = [{
                "corpus_id": r.corpus_id or r.id, "title": r.title,
                "abstract": r.abstract, "tldr": None, "year": r.year,
                "venue": r.venue, "citation_count": None,
                "authors": r.authors or [], "doi": None, "url": r.url,
                "source_scope": r.source_scope,
            } for r in rows]

        papers = _dedup(papers)[:MAX_FIRST_RENDER]
        if not papers:
            m.status = "error"
            m.error = "No papers retrieved (public API may be rate-limited — retry in a minute)."
            db.commit()
            tasks.fail(task_id, m.error)
            return

        tasks.update(task_id, step="Clustering and explaining connections", progress=55)
        clusters, whys = {}, {}
        try:
            labeled = _cluster_and_explain(m.title, papers)
            for c in labeled.get("clusters", []):
                for pid in c.get("paper_ids", []):
                    clusters[pid] = c["label"]
            for pw in labeled.get("papers", []):
                whys[pw.get("id")] = pw.get("why")
        except Exception:
            pass

        nodes = [center]
        edges = []
        for p in papers:
            node = _paper_node(p, why=whys.get(p["corpus_id"]))
            node["cluster"] = clusters.get(p["corpus_id"])
            nodes.append(node)
            edges.append({
                "id": f"e-{p['corpus_id']}", "source": "center",
                "target": p["corpus_id"], "source_scope": p["source_scope"],
                "relation_type": "cites" if p["corpus_id"] in cited_ids else "similar_topic",
            })

        tasks.update(task_id, step="Analyzing gaps", progress=85)
        gaps = []
        if m.seed_type == "manuscript":
            by_cluster: dict[str, dict] = {}
            for p in papers:
                c = clusters.get(p["corpus_id"])
                if not c:
                    continue
                g = by_cluster.setdefault(c, {"n": 0, "cited": 0, "ids": []})
                g["n"] += 1
                g["ids"].append(p["corpus_id"])
                if p["corpus_id"] in cited_ids:
                    g["cited"] += 1
            for label, g in by_cluster.items():
                if g["cited"] == 0 and g["n"] >= 2:
                    gaps.append({
                        "cluster": label, "count": g["n"], "paper_ids": g["ids"],
                        "message": f"{g['n']} papers in this cluster study "
                                   f"“{label}”. Your manuscript cites none of them.",
                    })

        m.graph = {"nodes": nodes, "edges": edges, "gaps": gaps}
        m.status = "ready"
        db.commit()
        tasks.finish(task_id, _mindmap_out(m))
    except Exception as e:
        try:
            db.rollback()
            m = db.get(MindMap, map_id)
            m.status = "error"
            m.error = str(e)[:300]
            db.commit()
        except Exception:
            pass
        tasks.fail(task_id, str(e)[:400])
    finally:
        db.close()


@router.post("/mindmaps")
def create_mindmap(body: CreateBody, background: BackgroundTasks, db=Depends(get_db)):
    if body.seed_type not in ("question", "manuscript", "collection"):
        raise HTTPException(400, "seed_type must be question|manuscript|collection")
    title = body.title
    seed_ref: dict = {}
    if body.seed_type == "question":
        if not body.question:
            raise HTTPException(400, "question required")
        seed_ref = {"question": body.question}
        title = title or body.question[:120]
    elif body.seed_type == "manuscript":
        ms = db.get(Manuscript, body.manuscript_id or "")
        if not ms or ms.tenant_id != settings.tenant_id:
            raise HTTPException(404, "manuscript not found")
        seed_ref = {"manuscript_id": ms.id}
        title = title or f"Around: {ms.title[:100]}"
    else:
        if not body.paper_ids or len(body.paper_ids) < 2:
            raise HTTPException(400, "at least 2 paper_ids required")
        seed_ref = {"paper_ids": body.paper_ids[:30]}
        title = title or f"Collection map ({len(body.paper_ids)} papers)"

    m = MindMap(tenant_id=settings.tenant_id, title=title,
                seed_type=body.seed_type, seed_ref=seed_ref)
    db.add(m)
    db.commit()
    task_id = tasks.create("mindmap")
    background.add_task(run_generate, task_id, m.id)
    return {"id": m.id, "task_id": task_id}


@router.get("/mindmaps")
def list_mindmaps(manuscript_id: str | None = None, db=Depends(get_db)):
    """Saved maps only — creating a map never clutters the list; keeping it
    is the user's choice. Unsaved drafts older than a day are purged."""
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    (db.query(MindMap)
     .filter(MindMap.tenant_id == settings.tenant_id,
             MindMap.saved.is_(False), MindMap.created_at < cutoff)
     .delete(synchronize_session=False))
    db.commit()

    q = db.query(MindMap).filter_by(tenant_id=settings.tenant_id)
    if manuscript_id:
        rows = [r for r in q.order_by(MindMap.created_at.desc()).limit(50).all()
                if (r.seed_ref or {}).get("manuscript_id") == manuscript_id]
    else:
        rows = (q.filter(MindMap.saved.is_(True))
                .order_by(MindMap.created_at.desc()).limit(30).all())
    return [_mindmap_out(r, with_graph=False) for r in rows]


class SavedBody(BaseModel):
    saved: bool


@router.patch("/mindmaps/{map_id}")
def save_mindmap(map_id: str, body: SavedBody, db=Depends(get_db)):
    m = db.get(MindMap, map_id)
    if not m or m.tenant_id != settings.tenant_id:
        raise HTTPException(404, "map not found")
    m.saved = body.saved
    db.commit()
    return _mindmap_out(m, with_graph=False)


@router.delete("/mindmaps/{map_id}")
def delete_mindmap(map_id: str, db=Depends(get_db)):
    m = db.get(MindMap, map_id)
    if not m or m.tenant_id != settings.tenant_id:
        raise HTTPException(404, "map not found")
    db.delete(m)
    db.commit()
    return {"deleted": map_id}


@router.get("/mindmaps/{map_id}")
def get_mindmap(map_id: str, db=Depends(get_db)):
    m = db.get(MindMap, map_id)
    if not m or m.tenant_id != settings.tenant_id:
        raise HTTPException(404, "map not found")
    return _mindmap_out(m)


class ExpandBody(BaseModel):
    node_id: str


@router.post("/mindmaps/{map_id}/expand")
def expand_node(map_id: str, body: ExpandBody, db=Depends(get_db)):
    """Lazy expansion: fetch neighbors of one paper node, merge into the graph."""
    m = db.get(MindMap, map_id)
    if not m or m.tenant_id != settings.tenant_id or not m.graph:
        raise HTTPException(404, "map not found")
    graph = dict(m.graph)
    known = {n["id"] for n in graph["nodes"]}
    if body.node_id not in known:
        raise HTTPException(404, "node not found")
    try:
        neighbors = s2.recommendations([body.node_id], limit=5)
    except Exception:
        raise HTTPException(429, "Public API rate-limited — retry in a minute")
    parent = next(n for n in graph["nodes"] if n["id"] == body.node_id)
    added = 0
    for p in neighbors:
        if p["corpus_id"] in known:
            continue
        node = _paper_node(p, why=f"Recommended from “{parent['label'][:60]}”")
        node["cluster"] = parent.get("cluster")
        graph["nodes"].append(node)
        graph["edges"].append({
            "id": f"e-{body.node_id}-{p['corpus_id']}", "source": body.node_id,
            "target": p["corpus_id"], "source_scope": p["source_scope"],
            "relation_type": "similar_topic",
        })
        known.add(p["corpus_id"])
        added += 1
    m.graph = graph
    db.commit()
    return {"added": added, "graph": graph}
