"""Library (saved papers / collections) + University repository listing +
recent search history for the dashboard."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from ..models import SavedPaper, SearchLog, UniversityPaper

router = APIRouter()


class SaveBody(BaseModel):
    corpus_id: str
    title: str
    authors: list[str] = []
    year: int | None = None
    venue: str = ""
    abstract: str = ""
    url: str | None = None
    source_scope: str = "public"
    collection: str = "Saved papers"


def _saved_out(r: SavedPaper) -> dict:
    return {
        "id": r.id, "corpus_id": r.corpus_id, "title": r.title,
        "authors": r.authors or [], "year": r.year, "venue": r.venue,
        "abstract": (r.abstract or "")[:400], "url": r.url,
        "source_scope": r.source_scope, "collection": r.collection,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("/library")
def save_paper(body: SaveBody, db=Depends(get_db),
               current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    existing = (db.query(SavedPaper)
                .filter_by(tenant_id=settings.tenant_id, user_id=user_id,
                          corpus_id=body.corpus_id)
                .first())
    if existing:
        return {"saved": _saved_out(existing), "already": True}
    r = SavedPaper(tenant_id=settings.tenant_id, user_id=user_id, **body.model_dump())
    db.add(r)
    db.commit()
    return {"saved": _saved_out(r), "already": False}


@router.get("/library")
def list_library(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    rows = (db.query(SavedPaper)
            .filter_by(tenant_id=settings.tenant_id, user_id=current_user["user_id"])
            .order_by(SavedPaper.created_at.desc()).limit(200).all())
    return [_saved_out(r) for r in rows]


@router.get("/library/{paper_id}")
def get_saved_paper(paper_id: str, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    """Focus data for a saved paper: stored meta enriched with live public
    metadata (citation count, TLDR) when the paper is public."""
    r = db.get(SavedPaper, paper_id)
    if not r or r.tenant_id != settings.tenant_id or r.user_id != current_user["user_id"]:
        raise HTTPException(404, "not found")
    out = _saved_out(r)
    out["abstract"] = r.abstract or ""
    if r.source_scope == "public" and r.corpus_id:
        try:
            from ..services import s2
            live = s2.paper_details(r.corpus_id)
            if live:
                out["citation_count"] = live.get("citation_count")
                out["tldr"] = live.get("tldr")
                out["venue"] = out["venue"] or live.get("venue")
                out["year"] = out["year"] or live.get("year")
                out["open_access_pdf_url"] = live.get("open_access_pdf_url")
                out["abstract"] = out["abstract"] or live.get("abstract") or ""
        except Exception:
            pass
    return out


@router.delete("/library/{paper_id}")
def remove_paper(paper_id: str, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    r = db.get(SavedPaper, paper_id)
    if not r or r.tenant_id != settings.tenant_id or r.user_id != current_user["user_id"]:
        raise HTTPException(404, "not found")
    db.delete(r)
    db.commit()
    return {"deleted": paper_id}


def _uni_out(r: UniversityPaper, full: bool = False) -> dict:
    return {
        "id": r.id, "title": r.title,
        "abstract": (r.abstract or "") if full else (r.abstract or "")[:400],
        "authors": r.authors or [], "year": r.year, "venue": r.venue,
        "doi": r.doi, "s2_id": r.s2_id, "collection": r.collection_name,
        "source_scope": "university",
    }


@router.get("/university")
def list_university(q: str | None = None, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    """Tenant-scoped, shared across every user of the institution by design:
    this is the university's own corpus, not private per-user data."""
    base = db.query(UniversityPaper).filter_by(tenant_id=settings.tenant_id)
    if not q:
        rows = base.order_by(UniversityPaper.year.desc().nullslast()).limit(100).all()
        return [_uni_out(r) for r in rows]

    from sqlalchemy import or_
    lexical = (base.filter(or_(UniversityPaper.title.ilike(f"%{q}%"),
                               UniversityPaper.abstract.ilike(f"%{q}%")))
               .limit(50).all())
    found = {r.id: r for r in lexical}
    try:
        from ..services import embeddings
        hits = embeddings.search(f"uni_{settings.tenant_id}", q, limit=10)
        for h in hits:
            pid = h.get("paper_id")
            if pid and pid not in found:
                r = base.filter(UniversityPaper.id == pid).first()
                if r:
                    found[r.id] = r
    except Exception:
        pass
    return [_uni_out(r) for r in found.values()]


@router.get("/university/{paper_id}")
def get_university_paper(paper_id: str, db=Depends(get_db),
                          current_user: dict = Depends(get_current_user)):
    r = db.get(UniversityPaper, paper_id)
    if not r or r.tenant_id != settings.tenant_id:
        raise HTTPException(404, "paper not found")
    return _uni_out(r, full=True)


@router.get("/searches/recent")
def recent_searches(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    rows = (db.query(SearchLog)
            .filter_by(tenant_id=settings.tenant_id, user_id=current_user["user_id"])
            .order_by(SearchLog.created_at.desc()).limit(10).all())
    return [{
        "id": r.id, "query": r.query, "scope": r.scope, "n_results": r.n_results,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]
