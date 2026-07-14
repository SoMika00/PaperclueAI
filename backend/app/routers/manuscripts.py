from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from ..config import settings
from ..db import get_db
from ..models import EvidenceItem, Issue, Manuscript, Reference, Version
from ..serializers import (evidence_out, issue_out, manuscript_out,
                           reference_out, version_out)

router = APIRouter()


def get_ms(db, ms_id: str) -> Manuscript:
    ms = db.get(Manuscript, ms_id)
    if not ms or ms.tenant_id != settings.tenant_id:
        raise HTTPException(404, "Manuscript not found")
    return ms


@router.get("/manuscripts")
def list_manuscripts(db=Depends(get_db)):
    rows = (db.query(Manuscript).filter_by(tenant_id=settings.tenant_id)
            .order_by(Manuscript.created_at.desc()).all())
    return [manuscript_out(m) for m in rows]


@router.get("/manuscripts/{ms_id}")
def get_manuscript(ms_id: str, db=Depends(get_db)):
    return manuscript_out(get_ms(db, ms_id), full=True)


@router.get("/documents/{ms_id}/status")
def ingest_status(ms_id: str, db=Depends(get_db)):
    ms = get_ms(db, ms_id)
    return {"id": ms.id, "status": ms.status, "steps": ms.ingest_steps or {},
            "readiness": ms.readiness}


@router.get("/manuscripts/{ms_id}/pdf")
def get_pdf(ms_id: str, db=Depends(get_db)):
    ms = get_ms(db, ms_id)
    return FileResponse(ms.file_path, media_type="application/pdf")


@router.get("/manuscripts/{ms_id}/references")
def list_references(ms_id: str, db=Depends(get_db)):
    get_ms(db, ms_id)
    rows = db.query(Reference).filter_by(manuscript_id=ms_id).all()
    return [reference_out(r) for r in rows]


@router.get("/manuscripts/{ms_id}/issues")
def list_issues(ms_id: str, db=Depends(get_db)):
    get_ms(db, ms_id)
    rows = db.query(Issue).filter_by(manuscript_id=ms_id).all()
    order = {"critical": 0, "major": 1, "minor": 2}
    rows.sort(key=lambda i: (i.status != "open", order.get(i.severity, 3)))
    return [issue_out(i) for i in rows]


@router.get("/manuscripts/{ms_id}/evidence")
def list_evidence(ms_id: str, db=Depends(get_db)):
    get_ms(db, ms_id)
    rows = (db.query(EvidenceItem).filter_by(manuscript_id=ms_id)
            .order_by(EvidenceItem.created_at.desc()).limit(100).all())
    return [evidence_out(e) for e in rows]


@router.get("/manuscripts/{ms_id}/versions")
def list_versions(ms_id: str, db=Depends(get_db)):
    get_ms(db, ms_id)
    rows = (db.query(Version).filter_by(manuscript_id=ms_id)
            .order_by(Version.number.desc()).all())
    return [version_out(v) for v in rows]
