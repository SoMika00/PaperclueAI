"""Library (saved papers / collections) + University repository listing +
recent search history for the dashboard."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

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
def save_paper(body: SaveBody, db=Depends(get_db)):
    existing = (db.query(SavedPaper)
                .filter_by(tenant_id=settings.tenant_id, corpus_id=body.corpus_id)
                .first())
    if existing:
        return {"saved": _saved_out(existing), "already": True}
    r = SavedPaper(tenant_id=settings.tenant_id, **body.model_dump())
    db.add(r)
    db.commit()
    return {"saved": _saved_out(r), "already": False}


@router.get("/library")
def list_library(db=Depends(get_db)):
    rows = (db.query(SavedPaper).filter_by(tenant_id=settings.tenant_id)
            .order_by(SavedPaper.created_at.desc()).limit(200).all())
    return [_saved_out(r) for r in rows]


@router.delete("/library/{paper_id}")
def remove_paper(paper_id: str, db=Depends(get_db)):
    r = db.get(SavedPaper, paper_id)
    if not r or r.tenant_id != settings.tenant_id:
        raise HTTPException(404, "not found")
    db.delete(r)
    db.commit()
    return {"deleted": paper_id}


@router.get("/university")
def list_university(q: str | None = None, db=Depends(get_db)):
    query = db.query(UniversityPaper).filter_by(tenant_id=settings.tenant_id)
    if q:
        query = query.filter(UniversityPaper.title.ilike(f"%{q}%"))
    rows = query.order_by(UniversityPaper.year.desc().nullslast()).limit(100).all()
    return [{
        "id": r.id, "title": r.title, "abstract": (r.abstract or "")[:400],
        "authors": r.authors or [], "year": r.year, "venue": r.venue,
        "doi": r.doi, "collection": r.collection_name,
        "source_scope": "university",
    } for r in rows]


@router.get("/searches/recent")
def recent_searches(db=Depends(get_db)):
    rows = (db.query(SearchLog).filter_by(tenant_id=settings.tenant_id)
            .order_by(SearchLog.created_at.desc()).limit(10).all())
    return [{
        "id": r.id, "query": r.query, "scope": r.scope, "n_results": r.n_results,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]
