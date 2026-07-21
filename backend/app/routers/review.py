"""Peer-review loop: async pipeline -> list[Issue] -> accept/reject -> new version.
Citation verification crosses the manuscript refs against the public corpus (/verify)."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from .. import tasks
from ..auth import get_current_user
from ..config import settings
from ..db import SessionLocal, get_db
from ..models import EvidenceItem, Issue, Manuscript, Reference, Section, Version
from ..serializers import issue_out, reference_out, version_out
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


def verify_refs(db, ms: Manuscript, limit: int = 25) -> list[dict]:
    """The ONLY corpus crossing: manuscript refs resolved against public S2."""
    refs = db.query(Reference).filter_by(manuscript_id=ms.id).all()
    results = []
    for ref in refs[:limit]:
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
        last = (db.query(Version).filter_by(manuscript_id=ms.id)
                .order_by(Version.number.desc()).first())
        n = (last.number if last else 0) + 1
        readiness.refresh(db, ms)
        db.add(Version(
            manuscript_id=ms.id, number=n,
            label=f"Fix applied: {issue.title[:80]}",
            diff_summary=[{"issue_id": issue.id, "before": issue.quote,
                           "after": issue.suggestion[:400]}],
            readiness=ms.readiness,
        ))
        db.commit()
    else:
        readiness.refresh(db, ms)
    return {"issue": issue_out(issue), "readiness": ms.readiness,
            "versions": [version_out(v) for v in
                         db.query(Version).filter_by(manuscript_id=ms.id)
                         .order_by(Version.number.desc()).all()]}
