"""POST /ingest - upload PDF, visible pipeline. The workspace opens as soon as
the text is parsed; embedding/indexing continues in the background with a
lexical-search fallback until the semantic index is ready."""
import os
import re

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile

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
        ms.index_status = "indexing"
        ms.qdrant_collection = f"ms_{ms.id}"
        db.add(Version(manuscript_id=ms.id, number=1, label="Original upload",
                       readiness=0))
        db.commit()
        from ..services import readiness
        readiness.refresh(db, ms)

        # 4. Semantic indexing, batched, in the background of the background.
        _set_step(db, ms, "indexing", "running")
        try:
            chunks = pdf_parse.chunk_pages(pages, sections)
            if chunks:
                embeddings.upsert_chunks(ms.qdrant_collection, chunks, batch_size=48)
            ms.index_status = "ready"
            _set_step(db, ms, "indexing", "done")
        except Exception as e:
            ms.index_status = "failed"
            _set_step(db, ms, "indexing", f"failed: {str(e)[:120]}")
        db.commit()
    except Exception as e:
        db.rollback()
        ms = db.get(Manuscript, ms_id)
        ms.status = "error"
        _set_step(db, ms, "error", str(e)[:300])
        db.commit()
    finally:
        db.close()


@router.post("/ingest")
async def ingest(file: UploadFile, background: BackgroundTasks, db=Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")
    os.makedirs(settings.storage_dir, exist_ok=True)
    ms = Manuscript(tenant_id=settings.tenant_id, file_path="",
                    title=re.sub(r"\.pdf$", "", file.filename, flags=re.I)[:200],
                    ingest_steps={s: "pending" for s in STEPS})
    db.add(ms)
    db.commit()
    path = os.path.join(settings.storage_dir, f"{ms.id}.pdf")
    with open(path, "wb") as f:
        f.write(await file.read())
    ms.file_path = path
    db.commit()
    background.add_task(run_pipeline, ms.id)
    return manuscript_out(ms)
