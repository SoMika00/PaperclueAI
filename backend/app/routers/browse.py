"""Federated grounded search. Scopes: public (Semantic Scholar) | university (tenant
Qdrant+Postgres, RLS-filtered BEFORE scoring) | combined (per-source normalized ranking).
Report synthesis via Claude, citations strictly restricted to retrieved papers."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from .. import tasks
from ..auth import get_current_user
from ..config import settings
from ..db import SessionLocal
from ..models import EvidenceItem, Manuscript, SearchLog, UniversityPaper
from ..services import claude, embeddings, s2

router = APIRouter()

UNI_COLLECTION = embeddings.tenant_collection("uni")


class BrowseBody(BaseModel):
    query: str
    scope: str = "combined"  # public | university | mine | combined
    manuscript_id: str | None = None
    year_from: int | None = None


def _search_mine(query: str, user_id: str, limit: int = 6) -> list[dict]:
    """Private RAG over THIS user's own uploaded manuscripts only."""
    db = SessionLocal()
    try:
        out = []
        mss = (db.query(Manuscript)
               .filter_by(tenant_id=settings.tenant_id, user_id=user_id, status="ready").all())
        for ms in mss:
            if not ms.qdrant_collection:
                continue
            if ms.index_status != "ready":
                continue
            for h in embeddings.search(ms.qdrant_collection, query, limit=3,
                                       tenant_id=settings.tenant_id, user_id=user_id):
                out.append({
                    "corpus_id": f"{ms.id}:p{h.get('page')}",
                    "title": f"{ms.title} — p.{h.get('page')} ({h.get('section', '')})",
                    "abstract": h.get("text", ""), "tldr": None,
                    "year": None, "venue": "Your manuscript",
                    "citation_count": 0, "authors": ms.authors or [],
                    "doi": None, "open_access_pdf_url": None,
                    "url": None, "manuscript_id": ms.id, "page": h.get("page"),
                    "source_scope": "manuscript",
                    "score": round(h.get("score", 0), 3),
                })
        out.sort(key=lambda x: -x["score"])
        return out[:limit]
    finally:
        db.close()


def _search_university(query: str, limit: int = 8) -> list[dict]:
    """Tenant-scoped search. The RLS filter (tenant_id) applies before scoring;
    university text NEVER leaves the tenant."""
    hits = embeddings.search(UNI_COLLECTION, query, limit=limit,
                             tenant_id=settings.tenant_id)
    db = SessionLocal()
    try:
        out = []
        for h in hits:
            p = (db.query(UniversityPaper)
                 .filter_by(id=h.get("paper_id"), tenant_id=settings.tenant_id)
                 .first())
            if p:
                out.append({
                    "corpus_id": p.id, "title": p.title, "abstract": p.abstract,
                    "tldr": None, "year": p.year, "venue": p.venue,
                    "citation_count": 0, "authors": p.authors or [],
                    "doi": p.doi, "open_access_pdf_url": None,
                    "url": None, "collection": p.collection_name,
                    "source_scope": "university", "score": round(h.get("score", 0), 3),
                })
        return out
    finally:
        db.close()


def _rank_explanation(p: dict, query: str) -> str:
    bits = []
    if p.get("year"):
        bits.append(str(p["year"]))
    if p.get("citation_count"):
        bits.append(f"{p['citation_count']:,} citations")
    if p.get("venue"):
        bits.append(p["venue"][:40])
    if p["source_scope"] == "university":
        bits.append(f"internal - {p.get('collection', '')}")
    return " - ".join(bits)


def run_browse(task_id: str, body: BrowseBody, user_id: str):
    try:
        papers: list[dict] = []
        tasks.update(task_id, step="retrieving", progress=15)

        warnings = []
        if body.scope in ("public", "combined"):
            try:
                papers += s2.search(body.query, limit=10, year_from=body.year_from)
            except Exception:
                warnings.append("Public search is rate-limited right now; "
                                "showing university results only. Retry in a minute.")
        if body.scope in ("university", "combined"):
            try:
                papers += _search_university(body.query)
            except Exception:
                warnings.append("University corpus search failed.")
        if body.scope == "mine":
            try:
                papers += _search_mine(body.query, user_id)
            except Exception:
                pass
        if not papers:
            tasks.fail(task_id, warnings[0] if warnings
                       else "No papers retrieved for this query.")
            return

        seen, dedup = set(), []
        for p in papers:
            key = (p.get("doi") or p["title"].lower()[:80])
            if key not in seen:
                seen.add(key)
                dedup.append(p)
        mine = [p for p in dedup if p["source_scope"] == "manuscript"]
        uni = [p for p in dedup if p["source_scope"] == "university"]
        pub = [p for p in dedup if p["source_scope"] == "public"]
        merged = []
        for i in range(max(len(uni), len(pub), len(mine))):
            for group in (mine, uni, pub):
                if i < len(group):
                    merged.append(group[i])
        merged = merged[:14]
        for i, p in enumerate(merged):
            p["ref_index"] = i + 1
            p["rank_explanation"] = _rank_explanation(p, body.query)

        tasks.update(task_id, step="synthesizing", progress=45,
                     result={"papers": merged, "report": None})

        corpus = "\n\n".join(
            f"[{p['ref_index']}] ({p['source_scope'].upper()}) {p['title']} "
            f"({p.get('year')}) - {(p.get('tldr') or p.get('abstract') or '')[:800]}"
            for p in merged
        )
        report = claude.complete(
            f"Research question: {body.query}\n\nRETRIEVED PAPERS:\n{corpus}\n\n"
            "Write a structured literature synthesis (markdown, 3-5 short sections "
            "with ## headings). CRITICAL RULES:\n"
            "- Every claim must carry an inline citation like [1] or [2,3] referring "
            "ONLY to the retrieved papers above. Never cite anything else.\n"
            "- If the papers don't cover an aspect, say so explicitly.\n"
            "- End with a '## Comparison' section: a markdown table comparing the 3-5 "
            "most relevant papers (approach, contribution, limitation).\n"
            "- Be dense and factual, ~350 words max before the table.",
            model=settings.claude_model_smart, max_tokens=3000,
        )
        result = {"papers": merged, "report": report, "query": body.query,
                  "scope": body.scope, "warnings": warnings}
        tasks.finish(task_id, result)

        db = SessionLocal()
        try:
            db.add(SearchLog(tenant_id=settings.tenant_id, user_id=user_id,
                             query=body.query[:500],
                             scope=body.scope, n_results=len(merged)))
            db.commit()
        finally:
            db.close()

        if body.manuscript_id:
            db = SessionLocal()
            try:
                # Only attach evidence to a manuscript this user actually owns.
                ms = (db.query(Manuscript)
                      .filter_by(id=body.manuscript_id, tenant_id=settings.tenant_id,
                                user_id=user_id).first())
                if ms:
                    for p in merged[:5]:
                        db.add(EvidenceItem(
                            manuscript_id=body.manuscript_id,
                            claim=f"Browse: '{body.query}' -> {p['title'][:150]}",
                            kind="browse",
                            source_type=("university_paper" if p["source_scope"] == "university"
                                         else "public_paper"),
                            source_ref={"corpus_id": p["corpus_id"], "title": p["title"],
                                        "url": p.get("url"), "year": p.get("year"),
                                        "source_scope": p["source_scope"]},
                            confidence=0.9, status="verified",
                        ))
                    db.commit()
            finally:
                db.close()
    except Exception as e:
        tasks.fail(task_id, str(e)[:400])


@router.post("/browse")
def browse(body: BrowseBody, background: BackgroundTasks,
           current_user: dict = Depends(get_current_user)):
    if body.scope not in ("public", "university", "mine", "combined"):
        raise HTTPException(400, "invalid scope")
    task_id = tasks.create("browse", current_user["user_id"])
    background.add_task(run_browse, task_id, body, current_user["user_id"])
    return {"task_id": task_id}


@router.get("/tasks/{task_id}")
def task_status(task_id: str, current_user: dict = Depends(get_current_user)):
    t = tasks.get_for_user(task_id, current_user["user_id"])
    if not t:
        raise HTTPException(404, "task not found")
    return t
