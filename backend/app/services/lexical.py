"""Lexical fallback search over a manuscript's sections — used while the
semantic index is still building (or if it failed), so chat/explain never
dead-end on a fresh upload."""
import re

from ..models import Section


def _paragraphs(section: Section) -> list[str]:
    parts = re.split(r"\n\s*\n", section.text or "")
    return [p.strip() for p in parts if len(p.strip()) > 80]


def search(db, manuscript_id: str, query: str, limit: int = 6) -> list[dict]:
    words = {w for w in re.findall(r"[a-zà-ÿ]{4,}", query.lower())}
    if not words:
        return []
    scored = []
    sections = db.query(Section).filter_by(manuscript_id=manuscript_id).all()
    for s in sections:
        for para in _paragraphs(s):
            low = para.lower()
            score = sum(low.count(w) for w in words)
            if score > 0:
                scored.append({
                    "text": para[:900], "page": s.page_start,
                    "section": s.name, "score": float(score),
                })
    scored.sort(key=lambda x: -x["score"])
    return scored[:limit]
