from .models import EvidenceItem, Issue, Manuscript, Reference, Version


def manuscript_out(ms: Manuscript, full: bool = False) -> dict:
    out = {
        "id": ms.id,
        "title": ms.title,
        "authors": ms.authors or [],
        "field_of_study": ms.field_of_study,
        "n_pages": ms.n_pages,
        "status": ms.status,
        "index_status": ms.index_status or "ready",
        "ingest_steps": ms.ingest_steps or {},
        "readiness": ms.readiness,
        "readiness_detail": ms.readiness_detail or {},
        "source_scope": ms.source_scope,
        "created_at": ms.created_at.isoformat() if ms.created_at else None,
        "updated_at": ms.updated_at.isoformat() if ms.updated_at else None,
        "has_insight": bool(ms.insight),
    }
    if full:
        out["insight"] = ms.insight
        out["sections"] = [
            {"id": s.id, "name": s.name, "order": s.order, "page_start": s.page_start}
            for s in sorted(ms.sections, key=lambda x: x.order)
        ]
    return out


def reference_out(r: Reference) -> dict:
    return {
        "id": r.id, "raw": r.raw, "title": r.title, "year": r.year,
        "authors": r.authors or [], "status": r.status,
        "resolved_scope": r.resolved_scope, "corpus_id": r.corpus_id,
        "resolved_meta": r.resolved_meta,
    }


def issue_out(i: Issue) -> dict:
    return {
        "id": i.id, "severity": i.severity, "category": i.category,
        "title": i.title, "description": i.description, "quote": i.quote,
        "page": i.page, "section": i.section, "suggestion": i.suggestion,
        "evidence_note": i.evidence_note, "confidence": i.confidence,
        "status": i.status,
    }


def evidence_out(e: EvidenceItem) -> dict:
    return {
        "id": e.id, "claim": e.claim, "kind": e.kind,
        "source_type": e.source_type, "source_ref": e.source_ref,
        "confidence": e.confidence, "status": e.status,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


def version_out(v: Version) -> dict:
    return {
        "id": v.id, "number": v.number, "label": v.label,
        "diff_summary": v.diff_summary or [], "readiness": v.readiness,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }
