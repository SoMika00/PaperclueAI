"""Mind Map: manuscript at the center, university (yellow) + public (blue) neighbors.
Every edge carries {source_scope, relation_type} - provenance is data, never color."""
from fastapi import APIRouter, BackgroundTasks, Depends

from .. import tasks
from ..db import SessionLocal, get_db
from ..models import Manuscript, Reference
from ..services import claude, s2
from .browse import _search_university
from .manuscripts import get_ms

router = APIRouter()


def run_mindmap(task_id: str, ms_id: str):
    db = SessionLocal()
    try:
        ms = db.get(Manuscript, ms_id)
        tasks.update(task_id, step="Finding public neighbors", progress=15)

        insight = ms.insight or {}
        query = ms.title
        if insight.get("keywords"):
            query = f"{ms.title} {' '.join(insight['keywords'][:5])}"

        # Public neighbors: verified refs -> recommendations, else keyword search
        verified_ids = [r.corpus_id for r in
                        db.query(Reference).filter_by(manuscript_id=ms_id, status="verified")
                        .limit(10).all() if r.corpus_id]
        public = []
        if verified_ids:
            try:
                public = s2.recommendations(verified_ids, limit=10)
            except Exception:
                public = []
        if len(public) < 6:
            try:
                extra = s2.search(query[:250], limit=10)
                seen = {p["corpus_id"] for p in public}
                public += [p for p in extra if p["corpus_id"] not in seen]
            except Exception:
                pass
        public = public[:12]

        tasks.update(task_id, step="Finding university neighbors", progress=45)
        university = _search_university(query[:250], limit=6)

        cited_ids = set(verified_ids)
        nodes = [{
            "id": "manuscript", "label": ms.title[:90], "type": "manuscript",
            "source_scope": "manuscript", "year": None, "meta": {},
        }]
        edges = []
        for p in public:
            nodes.append({
                "id": p["corpus_id"], "label": p["title"][:90], "type": "paper",
                "source_scope": "public", "year": p.get("year"),
                "meta": {"tldr": p.get("tldr") or (p.get("abstract") or "")[:220],
                         "citation_count": p.get("citation_count"),
                         "venue": p.get("venue"), "url": p.get("url"),
                         "authors": p.get("authors", [])[:3]},
            })
            edges.append({
                "id": f"e-{p['corpus_id']}", "source": "manuscript",
                "target": p["corpus_id"], "source_scope": "public",
                "relation_type": "citation" if p["corpus_id"] in cited_ids else "thematic",
            })
        for p in university:
            nodes.append({
                "id": p["corpus_id"], "label": p["title"][:90], "type": "paper",
                "source_scope": "university", "year": p.get("year"),
                "meta": {"tldr": (p.get("abstract") or "")[:220],
                         "collection": p.get("collection"),
                         "authors": p.get("authors", [])[:3]},
            })
            edges.append({
                "id": f"e-{p['corpus_id']}", "source": "manuscript",
                "target": p["corpus_id"], "source_scope": "university",
                "relation_type": "thematic",
            })

        tasks.update(task_id, step="Clustering and labeling (Claude)", progress=75)
        clusters = {}
        try:
            titles = [{"id": n["id"], "title": n["label"]} for n in nodes[1:]]
            labeled = claude.complete_json(
                "Group these papers into 2-4 thematic clusters. Return JSON: "
                "{\"clusters\": [{\"label\": \"short theme name\", \"paper_ids\": [ids]}]}\n\n"
                + str(titles), max_tokens=1500,
            )
            for c in labeled.get("clusters", []):
                for pid in c.get("paper_ids", []):
                    clusters[pid] = c["label"]
        except Exception:
            pass
        for n in nodes:
            n["cluster"] = clusters.get(n["id"])

        # Gap detection: clusters with no cited (citation-edge) paper
        cluster_cited = {}
        for e in edges:
            c = clusters.get(e["target"])
            if c:
                cluster_cited.setdefault(c, False)
                if e["relation_type"] == "citation":
                    cluster_cited[c] = True
        gaps = [c for c, cited in cluster_cited.items() if not cited]

        tasks.finish(task_id, {"nodes": nodes, "edges": edges, "gaps": gaps})
    except Exception as e:
        tasks.fail(task_id, str(e)[:400])
    finally:
        db.close()


@router.post("/mindmap/{ms_id}")
def build_mindmap(ms_id: str, background: BackgroundTasks, db=Depends(get_db)):
    get_ms(db, ms_id)
    task_id = tasks.create("mindmap")
    background.add_task(run_mindmap, task_id, ms_id)
    return {"task_id": task_id}
