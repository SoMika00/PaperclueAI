"""POST /ingest - upload PDF, visible pipeline. The workspace opens as soon as
the text is parsed; embedding/indexing continues in the background with a
lexical-search fallback until the semantic index is ready."""
import os
import re

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from pydantic import BaseModel

from ..auth import get_current_user
from ..config import settings
from ..db import SessionLocal, get_db
from ..models import Manuscript, Reference, Section, Version
from ..serializers import manuscript_out
from ..services import claude, embeddings, pdf_parse

router = APIRouter()

STEPS = ["parsing", "references", "metadata", "indexing"]


def _set_step(db, ms: Manuscript, step: str, state: str):
    steps = dict(ms.ingest_steps or {})
    steps[step] = state
    ms.ingest_steps = steps
    db.commit()


def run_pipeline(ms_id: str):
    db = SessionLocal()
    try:
        ms = db.get(Manuscript, ms_id)

        # 1. Extract text + structure
        _set_step(db, ms, "parsing", "running")
        pages = pdf_parse.extract_pages(ms.file_path)
        ms.n_pages = len(pages)
        sections = pdf_parse.split_sections(pages)
        for s in sections:
            db.add(Section(manuscript_id=ms.id, **s))
        db.commit()
        _set_step(db, ms, "parsing", "done")

        # 2. Extract references (Claude on the reference block)
        _set_step(db, ms, "references", "running")
        ref_block = pdf_parse.extract_reference_block(sections)
        if ref_block:
            try:
                parsed = claude.complete_json(
                    "Extract the bibliography entries from this References section. "
                    "Return a JSON array, each item: {\"raw\": \"the full entry text\", "
                    "\"title\": \"paper title only\", \"year\": 2020 or null, "
                    "\"authors\": [\"Last, F.\"]}. Max 40 entries.\n\n" + ref_block,
                    max_tokens=8000,
                )
                for r in parsed[:40]:
                    db.add(Reference(
                        manuscript_id=ms.id, raw=(r.get("raw") or "")[:1500],
                        title=(r.get("title") or "")[:400], year=r.get("year"),
                        authors=r.get("authors") or [],
                    ))
                db.commit()
            except Exception:
                pass
        _set_step(db, ms, "references", "done")

        # 3. Metadata detection
        _set_step(db, ms, "metadata", "running")
        try:
            head = pages[0][:3000]
            meta = claude.complete_json(
                "From this first page of an academic paper, extract JSON: "
                "{\"title\": str, \"authors\": [str], \"field_of_study\": str, "
                "\"language\": \"en\"|\"fr\"|...}.\n\n" + head,
                max_tokens=800,
            )
            ms.title = (meta.get("title") or pdf_parse.guess_title(pages))[:300]
            ms.authors = (meta.get("authors") or [])[:10]
            ms.field_of_study = (meta.get("field_of_study") or "")[:100]
            ms.language = meta.get("language") or "en"
        except Exception:
            ms.title = pdf_parse.guess_title(pages)
        _set_step(db, ms, "metadata", "done")

        # WORKSPACE OPENS HERE - the PDF is usable before the index exists.
        ms.status = "ready"
        # Semantic indexing is deliberately lazy. Chat and similarity features
        # trigger it only when a user actually needs vector retrieval.
        ms.index_status = "pending"
        ms.qdrant_collection = embeddings.manuscript_collection(ms.user_id, ms.id)
        db.add(Version(manuscript_id=ms.id, number=1, label="Original upload",
                       readiness=0))
        db.commit()
        from ..services import readiness
        readiness.refresh(db, ms)

        # 4. Deferred until a semantic use case is opened.
        _set_step(db, ms, "indexing", "on_demand")
    except Exception as e:
        db.rollback()
        ms = db.get(Manuscript, ms_id)
        ms.status = "error"
        _set_step(db, ms, "error", str(e)[:300])
        db.commit()
    finally:
        db.close()


class ImportBody(BaseModel):
    kind: str  # "library" | "university"
    id: str


MAX_PDF_BYTES = 30 * 1024 * 1024


def _download_pdf(url: str, dest: str):
    headers = {"User-Agent": "PaperClue/1.0 (research assistant; open-access import)"}
    with httpx.Client(timeout=30, follow_redirects=True, headers=headers) as c:
        r = c.get(url)
        r.raise_for_status()
        data = r.content
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(413, "PDF larger than 30 MB")
    if not data[:5].startswith(b"%PDF"):
        raise HTTPException(422, "The open-access link did not return a PDF")
    with open(dest, "wb") as f:
        f.write(data)


@router.post("/import")
def import_paper(body: ImportBody, background: BackgroundTasks, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    """Open any known paper in Focus: resolve its open-access PDF, download it
    and run the normal ingestion pipeline. The document joins My Research with
    its origin recorded."""
    from ..models import SavedPaper, UniversityPaper
    from ..services import s2

    user_id = current_user["user_id"]

    if body.kind == "library":
        row = db.get(SavedPaper, body.id)
        if (not row or row.tenant_id != settings.tenant_id
                or row.user_id != user_id):
            raise HTTPException(404, "paper not found")
        corpus_id, title, origin_from = row.corpus_id, row.title, row.source_scope
        if row.source_scope == "university":
            university_row = db.get(UniversityPaper, row.corpus_id)
            if not university_row or university_row.tenant_id != settings.tenant_id:
                raise HTTPException(404, "university paper not found")
            corpus_id = university_row.s2_id
    elif body.kind == "university":
        row = db.get(UniversityPaper, body.id)
        if not row or row.tenant_id != settings.tenant_id:
            raise HTTPException(404, "paper not found")
        corpus_id, title, origin_from = row.s2_id, row.title, "university"
    elif body.kind == "public":
        corpus_id, title, origin_from = body.id, "Public paper", "public"
    else:
        raise HTTPException(400, "kind must be library|university|public")

    # Already imported? Reopen the existing focus document, but only if it's
    # this user's own copy — never hand back another user's manuscript id.
    existing = (db.query(Manuscript)
                .filter_by(tenant_id=settings.tenant_id, user_id=user_id)
                .filter(Manuscript.origin.isnot(None)).all())
    for m in existing:
        if (m.origin or {}).get("corpus_id") == corpus_id and m.status != "error":
            return {"manuscript_id": m.id, "already": True}

    candidates = []
    if corpus_id:
        try:
            details = s2.paper_details(corpus_id) or {}
            title = details.get("title") or title
            if details.get("open_access_pdf_url"):
                candidates.append(details["open_access_pdf_url"])
            if details.get("arxiv_id"):  # most reliable host
                candidates.append(f"https://arxiv.org/pdf/{details['arxiv_id']}")
        except Exception:
            pass
    if not candidates:
        raise HTTPException(
            404, "No open-access full text is available for this paper — "
                 "Focus needs the PDF. You can still read its abstract here.")

    os.makedirs(settings.storage_dir, exist_ok=True)
    ms = Manuscript(
        tenant_id=settings.tenant_id, user_id=user_id, file_path="",
        title=(title or "Imported paper")[:200],
        origin={"corpus_id": corpus_id, "from": origin_from},
        ingest_steps={st: "pending" for st in STEPS},
    )
    db.add(ms)
    db.commit()
    path = os.path.join(settings.storage_dir, f"{ms.id}.pdf")
    last_err = None
    for url in candidates:
        try:
            _download_pdf(url, path)
            last_err = None
            break
        except Exception as e:
            last_err = e
    if last_err is not None:
        db.delete(ms)
        db.commit()
        raise HTTPException(
            502, f"Could not fetch the open-access PDF ({str(last_err)[:80]})")
    ms.file_path = path
    db.commit()
    background.add_task(run_pipeline, ms.id)
    return {"manuscript_id": ms.id, "already": False}


@router.post("/ingest")
async def ingest(file: UploadFile, background: BackgroundTasks, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    data = await file.read()
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(413, "PDF larger than 30 MB")
    if not data[:5].startswith(b"%PDF"):
        raise HTTPException(422, "This does not look like a valid PDF file")

    os.makedirs(settings.storage_dir, exist_ok=True)
    ms = Manuscript(tenant_id=settings.tenant_id, user_id=current_user["user_id"],
                    file_path="",
                    title=re.sub(r"\.pdf$", "", file.filename, flags=re.I)[:200],
                    ingest_steps={s: "pending" for s in STEPS})
    db.add(ms)
    db.commit()
    path = os.path.join(settings.storage_dir, f"{ms.id}.pdf")
    with open(path, "wb") as f:
        f.write(data)
    ms.file_path = path
    db.commit()
    background.add_task(run_pipeline, ms.id)
    return manuscript_out(ms)
