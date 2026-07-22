"""Paper Insight - structured brief + chat with your paper.
Every claim is anchored: {claim, section, page, quote} -> EvidenceItem + PDF highlight."""
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..auth import get_current_user
from ..db import get_db
from ..models import EvidenceItem, Section
from ..serializers import evidence_out
from ..services import claude, embeddings, lexical, readiness
from .manuscripts import get_ms

router = APIRouter()

BRIEF_PROMPT = """You are analyzing an academic manuscript. Produce a structured brief.
Return JSON:
{{
  "problem": {{"claim": str, "section": str, "page": int, "quote": "exact short quote from the text (max 25 words)"}},
  "contribution": {{...same shape}},
  "method": {{...}},
  "key_results": [{{...}}, ...max 3],
  "limitations": [{{...}}, ...max 2],
  "gap_hints": [str, ...max 3 light non-blocking suggestions like 'Methods does not mention a baseline'],
  "keywords": [str, ...max 8],
  "concepts": [str, ...max 6]
}}
The "quote" MUST be copied verbatim from the manuscript text so it can be located and highlighted.

MANUSCRIPT SECTIONS:
{content}
"""


@router.post("/insight/{ms_id}")
def build_insight(ms_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    ms = get_ms(db, ms_id, current_user["user_id"])
    if ms.insight:
        return {"insight": ms.insight, "cached": True}

    sections = (db.query(Section).filter_by(manuscript_id=ms_id)
                .order_by(Section.order).all())
    content = "\n\n".join(
        f"## {s.name} (page {s.page_start})\n{s.text[:4000]}" for s in sections
    )[:60000]

    brief = claude.complete_json(BRIEF_PROMPT.format(content=content), max_tokens=4000)
    ms.insight = brief
    db.commit()

    def add_evidence(item: dict, label: str):
        if not isinstance(item, dict) or not item.get("claim"):
            return
        db.add(EvidenceItem(
            manuscript_id=ms.id, claim=f"[{label}] {item['claim']}",
            kind="insight", source_type="manuscript_span",
            source_ref={"page": item.get("page"), "section": item.get("section"),
                        "quote": item.get("quote")},
            confidence=0.85, status="verified",
        ))

    add_evidence(brief.get("problem"), "Problem")
    add_evidence(brief.get("contribution"), "Contribution")
    add_evidence(brief.get("method"), "Method")
    for r in brief.get("key_results") or []:
        add_evidence(r, "Result")
    for l in brief.get("limitations") or []:
        add_evidence(l, "Limitation")
    db.commit()
    readiness.refresh(db, ms)
    return {"insight": brief, "cached": False}


class ChatBody(BaseModel):
    question: str
    history: list[dict] = []


@router.post("/insight/{ms_id}/chat")
async def chat(ms_id: str, body: ChatBody, db=Depends(get_db),
               current_user: dict = Depends(get_current_user)):
    """SSE stream. Grounded on the manuscript's private Qdrant collection only."""
    ms = get_ms(db, ms_id, current_user["user_id"])
    try:
        indexed = embeddings.ensure_manuscript_index(db, ms, current_user["user_id"])
        hits = (embeddings.search(ms.qdrant_collection, body.question, limit=6,
                                  tenant_id=ms.tenant_id,
                                  user_id=current_user["user_id"])
                if indexed else [])
    except Exception:
        hits = []
    if not hits:
        hits = lexical.search(db, ms.id, body.question, limit=6)
    context = "\n\n".join(
        f"[p.{h['page']} - {h['section']}] {h['text']}" for h in hits
    )
    system = (
        "You are PaperClue's 'chat with your paper'. Answer ONLY from the provided "
        "manuscript metadata and excerpts. Cite pages inline as (p.X). If neither "
        "contains the answer, say so - never invent. Be concise. Answer in the "
        "language of the question.\n\n"
        "MANUSCRIPT METADATA (verified at ingestion):\n"
        f"- Title: {ms.title}\n"
        f"- Authors: {', '.join(ms.authors or []) or 'unknown'} (title page, p.1)\n"
        f"- Field: {ms.field_of_study or 'unknown'} - {ms.n_pages} pages, "
        f"language: {ms.language}"
    )
    messages = [*body.history[-6:], {
        "role": "user",
        "content": f"MANUSCRIPT EXCERPTS:\n{context}\n\nQUESTION: {body.question}",
    }]

    sources = [{"page": h["page"], "section": h["section"],
                "quote": h["text"][:180], "score": round(h.get("score", 0), 3)}
               for h in hits[:4]]

    async def gen():
        yield f"event: sources\ndata: {json.dumps(sources)}\n\n"
        try:
            async for delta in claude.stream(messages, system=system):
                yield f"data: {json.dumps(delta)}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


class ExplainBody(BaseModel):
    text: str
    page: int | None = None


@router.post("/insight/{ms_id}/explain")
def explain_selection(ms_id: str, body: ExplainBody, db=Depends(get_db),
                       current_user: dict = Depends(get_current_user)):
    """PDF -> feature: contextual action on selected text."""
    ms = get_ms(db, ms_id, current_user["user_id"])
    try:
        indexed = embeddings.ensure_manuscript_index(db, ms, current_user["user_id"])
        hits = (embeddings.search(ms.qdrant_collection, body.text, limit=3,
                                  tenant_id=ms.tenant_id,
                                  user_id=current_user["user_id"])
                if indexed else [])
    except Exception:
        hits = []
    if not hits:
        hits = lexical.search(db, ms.id, body.text, limit=3)
    context = "\n".join(f"[p.{h['page']}] {h['text']}" for h in hits)
    answer = claude.complete(
        f"Selected passage from the manuscript (page {body.page}):\n\"{body.text[:1200]}\"\n\n"
        f"Surrounding context:\n{context[:4000]}\n\n"
        "Explain this passage clearly in 3-5 sentences: what it means and its role in the paper.",
        max_tokens=600,
    )
    e = EvidenceItem(
        manuscript_id=ms.id, claim=answer[:500], kind="insight",
        source_type="manuscript_span",
        source_ref={"page": body.page, "quote": body.text[:200], "section": ""},
        confidence=0.8, status="verified",
    )
    db.add(e)
    db.commit()
    return {"explanation": answer, "evidence": evidence_out(e)}
