"""Readiness Score (0-100) — explicable by construction: every component is 0
until the user actually did the thing. No free credit.

  base      15  manuscript ingested and structured
  insight   15  structured brief produced
  citations 30  x verified/total, only once references were checked
  review    40  minus open-issue penalties, only once a review ran

A fresh upload scores 15; running Insight -> 30; verifying cites -> up to 60;
a clean review -> up to 100. Accepting a fix visibly moves the number.
"""
from sqlalchemy.orm import Session

from ..models import Issue, Manuscript, Reference

WEIGHTS = {"citations": 30, "review": 40, "insight": 15, "base": 15}
SEV_PENALTY = {"critical": 12, "major": 6, "minor": 2}


def compute(db: Session, ms: Manuscript):
    refs = db.query(Reference).filter_by(manuscript_id=ms.id).all()
    issues = db.query(Issue).filter_by(manuscript_id=ms.id).all()

    base = WEIGHTS["base"] if ms.status == "ready" else 0
    ins = WEIGHTS["insight"] if ms.insight else 0

    checked = [r for r in refs if r.status != "unverified"]
    if refs and checked:
        verified = sum(1 for r in refs if r.status == "verified")
        cit = WEIGHTS["citations"] * verified / len(refs)
    else:
        cit = 0.0  # not checked yet -> no credit

    open_issues = [i for i in issues if i.status == "open"]
    if issues:  # a review has run
        penalty = sum(SEV_PENALTY.get(i.severity, 2) for i in open_issues)
        rev = max(0.0, WEIGHTS["review"] - penalty)
    else:
        rev = 0.0  # not reviewed yet -> no credit

    score = int(round(base + ins + cit + rev))
    detail = {
        "base": base,
        "insight": ins,
        "citations": round(cit, 1),
        "review": round(rev, 1),
        "insight_done": bool(ms.insight),
        "citations_checked": bool(checked),
        "review_done": bool(issues),
        "open_issues": len(open_issues),
        "refs_verified": sum(1 for r in refs if r.status == "verified"),
        "refs_total": len(refs),
    }
    return min(score, 100), detail


def refresh(db: Session, ms: Manuscript):
    score, detail = compute(db, ms)
    ms.readiness = score
    ms.readiness_detail = detail
    db.commit()
    return score
