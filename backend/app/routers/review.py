"""Peer-review loop: async pipeline -> list[Issue] -> accept/reject -> new version.
Citation verification crosses the manuscript refs against the public corpus (/verify)."""
import os
import shutil

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from .. import tasks
from ..auth import get_current_user
from ..config import settings
from ..db import SessionLocal, get_db
from ..models import EvidenceItem, Issue, Manuscript, Reference, Section, Version
from ..serializers import issue_out, manuscript_out, reference_out, version_out
from ..services import claude, readiness, s2
from .manuscripts import get_ms

router = APIRouter()

REVIEW_PROMPT = """You are an experienced peer reviewer for a top venue. Review this manuscript.
Return a JSON array of 6-10 issues. Each issue:
{{
  "severity": "critical"|"major"|"minor",
  "category": "grammar"|"clarity"|"methodology"|"structure"|"citation"|"ai_risk",
  "title": "short actionable title",
  "description": "2-3 sentence explanation of the problem",
  "quote": "exact short verbatim quote from the manuscript locating the issue (max 20 words)",
  "section": "section name",
  "page": page number (int),
  "suggestion": "concrete rewrite or fix",
  "confidence": 0.0-1.0
}}
Cover a mix: at least 1 methodology, 1 clarity, 1 structure issue. The quote MUST be
copied verbatim so it can be highlighted in the PDF. Write in English.

MANUSCRIPT:
{content}
"""


def run_review(task_id: str, ms_id: str):
    db = SessionLocal()
    try:
        ms = db.get(Manuscript, ms_id)
        tasks.update(task_id, step="Analyzing manuscript (grammar, clarity, methodology)", progress=10)

        sections = (db.query(Section).filter_by(manuscript_id=ms_id)
                    .order_by(Section.order).all())
        content = "\n\n".join(
            f"## {s.name} (page {s.page_start})\n{s.text[:3500]}"
            for s in sections if s.name.lower() not in ("references", "bibliography")
        )[:55000]

        issues = claude.complete_json(
            REVIEW_PROMPT.format(content=content),
            model=settings.claude_model_smart, max_tokens=6000,
        )
        db.query(Issue).filter_by(manuscript_id=ms_id, status="open").delete()
        for it in issues[:12]:
            db.add(Issue(
                manuscript_id=ms_id,
                severity=it.get("severity", "minor"),
                category=it.get("category", "clarity"),
                title=(it.get("title") or "")[:200],
                description=it.get("description") or "",
                quote=(it.get("quote") or "")[:400],
                section=(it.get("section") or "")[:100],
                page=it.get("page"),
                suggestion=it.get("suggestion") or "",
                confidence=float(it.get("confidence") or 0.7),
            ))
        db.commit()

        tasks.update(task_id, step="Verifying citations against the public corpus", progress=55)
        cit_results = verify_refs(db, ms)
        for r in cit_results:
            if r["status"] == "not_found":
                db.add(Issue(
                    manuscript_id=ms_id, severity="critical", category="citation",
                    title=f"Reference not resolvable: {r['title'][:80]}",
                    description="This reference could not be resolved to any real paper "
                                "in Semantic Scholar (214M papers). It may be hallucinated, "
                                "misspelled, or unpublished.",
                    quote=r["title"][:200], section="References",
                    suggestion="Verify the reference manually; replace or remove it.",
                    evidence_note="Resolved against Semantic Scholar: 0 match.",
                    confidence=0.85,
                ))
            elif r["status"] == "suspect":
                db.add(Issue(
                    manuscript_id=ms_id, severity="major", category="citation",
                    title=f"Citation metadata mismatch: {r['title'][:70]}",
                    description=f"Closest real paper: {r.get('matched_title', '')[:100]} "
                                f"({r.get('matched_year')}). Metadata differs from the manuscript entry.",
                    quote=r["title"][:200], section="References",
                    suggestion="Fix year/authors/title to match the resolved paper.",
                    evidence_note="Partial match via Semantic Scholar title resolution.",
                    confidence=0.7,
                ))
        db.commit()

        tasks.update(task_id, step="Compiling review report", progress=90)
        for i in db.query(Issue).filter_by(manuscript_id=ms_id, status="open").all():
            db.add(EvidenceItem(
                manuscript_id=ms_id, claim=f"[{i.severity}] {i.title}",
                kind="review",
                source_type="manuscript_span",
                source_ref={"page": i.page, "quote": i.quote, "section": i.section},
                confidence=i.confidence,
                status="verified" if i.category != "ai_risk" else "unverified",
            ))
        db.commit()
        readiness.refresh(db, ms)
        all_issues = db.query(Issue).filter_by(manuscript_id=ms_id).all()
        tasks.finish(task_id, {"issues": [issue_out(i) for i in all_issues],
                               "readiness": ms.readiness})
    except Exception as e:
        tasks.fail(task_id, str(e)[:400])
    finally:
        db.close()


def verify_refs(db, ms: Manuscript) -> list[dict]:
    """The ONLY corpus crossing: manuscript refs resolved against public S2."""
    refs = db.query(Reference).filter_by(manuscript_id=ms.id).all()
    results = []
    for ref in refs[:25]:
        if not ref.title or ref.status == "verified":
            if ref.status == "verified":
                results.append({"id": ref.id, "title": ref.title, "status": "verified"})
            continue
        try:
            match = s2.match_title(ref.title)
        except Exception:
            match = None
        if match and match.get("title"):
            same_year = (not ref.year or not match.get("year")
                         or abs(ref.year - match["year"]) <= 1)
            ref.status = "verified" if same_year else "suspect"
            ref.resolved_scope = "public"
            ref.corpus_id = match["corpus_id"]
            ref.resolved_meta = {"title": match["title"], "year": match.get("year"),
                                 "venue": match.get("venue"), "url": match.get("url"),
                                 "citation_count": match.get("citation_count")}
            results.append({"id": ref.id, "title": ref.title, "status": ref.status,
                            "matched_title": match["title"], "matched_year": match.get("year")})
        else:
            ref.status = "not_found"
            results.append({"id": ref.id, "title": ref.title, "status": "not_found"})
        db.commit()
    return results


@router.post("/review/{ms_id}")
def start_review(ms_id: str, background: BackgroundTasks, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    get_ms(db, ms_id, current_user["user_id"])
    task_id = tasks.create("review", current_user["user_id"])
    background.add_task(run_review, task_id, ms_id)
    return {"task_id": task_id}


def run_verify(task_id: str, ms_id: str):
    """Async: with the keyless S2 throttle, 40 refs take ~1 min."""
    db = SessionLocal()
    try:
        ms = db.get(Manuscript, ms_id)
        refs_total = db.query(Reference).filter_by(manuscript_id=ms_id).count()
        tasks.update(task_id, step=f"Resolving {refs_total} references against "
                                   "Semantic Scholar", progress=10)
        results = verify_refs(db, ms)
        readiness.refresh(db, ms)
        refs = db.query(Reference).filter_by(manuscript_id=ms_id).all()
        tasks.finish(task_id, {
            "results": results,
            "references": [reference_out(r) for r in refs],
            "readiness": ms.readiness,
        })
    except Exception as e:
        tasks.fail(task_id, str(e)[:400])
    finally:
        db.close()


@router.post("/verify/{ms_id}")
def verify(ms_id: str, background: BackgroundTasks, db=Depends(get_db),
           current_user: dict = Depends(get_current_user)):
    get_ms(db, ms_id, current_user["user_id"])
    task_id = tasks.create("verify", current_user["user_id"])
    background.add_task(run_verify, task_id, ms_id)
    return {"task_id": task_id}


class IssueAction(BaseModel):
    action: str  # accept | reject
    edit: str | None = None


def _create_revision_copy(db, source: Manuscript, selected_issue_id: str):
    """Clone a source into an explicitly derived, user-owned working copy."""
    origin = {
        "kind": "revision_copy",
        "working_copy_of": source.id,
        "source_title": source.title,
        "source_origin": source.origin,
    }
    copy = Manuscript(
        tenant_id=source.tenant_id, user_id=source.user_id, file_path="",
        title=f"Revision Copy — {source.title}"[:300], authors=source.authors or [],
        field_of_study=source.field_of_study, n_pages=source.n_pages,
        language=source.language, status="ready", index_status="pending",
        ingest_steps={**(source.ingest_steps or {}), "indexing": "on_demand"},
        qdrant_collection="", source_scope="derived", origin=origin,
        readiness=source.readiness, readiness_detail=source.readiness_detail or {},
        insight=None,
    )
    db.add(copy)
    db.flush()

    if source.file_path and os.path.exists(source.file_path):
        os.makedirs(settings.storage_dir, exist_ok=True)
        copy.file_path = os.path.join(settings.storage_dir, f"{copy.id}.pdf")
        shutil.copy2(source.file_path, copy.file_path)

    for section in source.sections:
        db.add(Section(manuscript_id=copy.id, name=section.name, order=section.order,
                       page_start=section.page_start, text=section.text))
    for ref in source.references:
        db.add(Reference(
            manuscript_id=copy.id, raw=ref.raw, title=ref.title, year=ref.year,
            authors=ref.authors or [], status=ref.status,
            resolved_scope=ref.resolved_scope, corpus_id=ref.corpus_id,
            resolved_meta=ref.resolved_meta,
        ))

    issue_map = {}
    for source_issue in source.issues:
        cloned = Issue(
            manuscript_id=copy.id, severity=source_issue.severity,
            category=source_issue.category, title=source_issue.title,
            description=source_issue.description, quote=source_issue.quote,
            page=source_issue.page, section=source_issue.section,
            suggestion=source_issue.suggestion,
            evidence_note=source_issue.evidence_note,
            confidence=source_issue.confidence, status=source_issue.status,
        )
        db.add(cloned)
        db.flush()
        issue_map[source_issue.id] = cloned

    db.add(Version(manuscript_id=copy.id, number=1,
                   label="Revision copy created — source preserved",
                   diff_summary=[], readiness=copy.readiness))
    db.flush()
    return copy, issue_map[selected_issue_id]


def _apply_section_fix(db, manuscript: Manuscript, issue: Issue, replacement: str) -> bool:
    sections = (db.query(Section).filter_by(manuscript_id=manuscript.id)
                .order_by(Section.order).all())
    preferred = [s for s in sections if issue.section and
                 s.name.lower() == issue.section.lower()]
    for section in preferred + [s for s in sections if s not in preferred]:
        if issue.quote and issue.quote in (section.text or ""):
            section.text = section.text.replace(issue.quote, replacement, 1)
            return True
    return False


@router.patch("/review-issues/{issue_id}")
def act_on_issue(issue_id: str, body: IssueAction, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "issue not found")
    ms = get_ms(db, issue.manuscript_id, current_user["user_id"])
    if body.action not in ("accept", "reject"):
        raise HTTPException(400, "action must be accept|reject")
    issue.status = "accepted" if body.action == "accept" else "rejected"
    if body.edit:
        issue.suggestion = body.edit
    db.commit()

    if body.action == "accept":
        if (ms.origin or {}).get("kind") == "revision_copy":
            working_copy, target_issue = ms, issue
        else:
            working_copy, target_issue = _create_revision_copy(db, ms, issue.id)

        replacement = (body.edit or issue.suggestion or "").strip()
        applied = bool(replacement) and _apply_section_fix(db, working_copy, target_issue,
                                                           replacement)
        target_issue.status = "accepted"
        target_issue.suggestion = replacement
        working_copy.insight = None
        working_copy.index_status = "pending"
        from ..services import embeddings
        working_copy.qdrant_collection = embeddings.manuscript_collection(
            current_user["user_id"], working_copy.id)

        last = (db.query(Version).filter_by(manuscript_id=working_copy.id)
                .order_by(Version.number.desc()).first())
        n = (last.number if last else 0) + 1
        readiness.refresh(db, working_copy)
        db.add(Version(
            manuscript_id=working_copy.id, number=n,
            label=("Fix applied" if applied else "Revision note saved")
                  + f": {issue.title[:80]}",
            diff_summary=[{"issue_id": issue.id, "before": issue.quote,
                           "after": replacement[:400], "applied": applied}],
            readiness=working_copy.readiness,
        ))
        db.commit()
        return {
            "issue": issue_out(target_issue), "readiness": working_copy.readiness,
            "versions": [version_out(v) for v in
                         db.query(Version).filter_by(manuscript_id=working_copy.id)
                         .order_by(Version.number.desc()).all()],
            "working_copy": manuscript_out(working_copy), "applied": applied,
            "source_preserved": True,
        }
    else:
        readiness.refresh(db, ms)
    return {"issue": issue_out(issue), "readiness": ms.readiness,
            "versions": [version_out(v) for v in
                         db.query(Version).filter_by(manuscript_id=ms.id)
                         .order_by(Version.number.desc()).all()]}
