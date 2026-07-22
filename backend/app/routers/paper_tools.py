"""Paper-intelligence tools for *suggested* papers (mind-map nodes, Focus
cards) that are NOT ingested manuscripts. Every existing insight/review
endpoint needs a full ingested Manuscript (parsed sections + Qdrant); these
tools instead run on a paper's public metadata and, when an open-access PDF
exists, its full text / figures / tables. Keyed by S2 corpus_id.

Text tools (summarize / key concepts / explanation / research gap) are
abstract-first, and transparently upgrade to full text when the user has
already imported this paper into Focus (so no extra download is needed).
Figures / tables need an open-access PDF and are honestly unavailable
otherwise. Journal ranking is an *estimate* from S2 citation metrics — S2
exposes no official quartile/SJR, so this is clearly labelled as such.
Results cache in PaperArtifact so repeat clicks are instant."""
import base64
import math
import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..config import settings
from ..auth import get_current_user
from ..db import get_db
from ..models import Manuscript, PaperArtifact, SavedPaper, Section, UniversityPaper
from ..services import claude, s2

router = APIRouter()

TEXT_KINDS = ("summary", "key_concepts", "explanation", "research_gap")
MAX_TEXT_CHARS = 40000
MAX_FIGURES = 8
MAX_TABLES = 12
MIN_FIGURE_DIM = 150          # px — drop logos / rules / bullet glyphs
MAX_FIGURE_DIM = 1000         # px — downscale big scans to keep payload sane


# ---------------------------------------------------------------- resolution

def _from_saved(row: SavedPaper) -> dict:
    return {
        "corpus_id": row.corpus_id or row.id, "title": row.title or "",
        "abstract": row.abstract or "", "tldr": None, "year": row.year,
        "venue": row.venue or "", "authors": row.authors or [],
        "citation_count": 0, "influential_citation_count": 0,
        "open_access_pdf_url": None, "arxiv_id": None, "url": row.url,
        "fields_of_study": [], "source_scope": row.source_scope or "public",
    }


def _from_university(row: UniversityPaper) -> dict:
    return {
        "corpus_id": row.s2_id or row.id, "title": row.title or "",
        "abstract": row.abstract or "", "tldr": None, "year": row.year,
        "venue": row.venue or "", "authors": row.authors or [],
        "citation_count": 0, "influential_citation_count": 0,
        "open_access_pdf_url": None, "arxiv_id": None, "url": None,
        "fields_of_study": [], "source_scope": "university",
    }


def _resolve_paper(db, corpus_id: str) -> dict | None:
    """Best-effort metadata for a paper id. Prefer live S2 (has abstract,
    venue, open-access PDF, citation metrics); fall back to whatever we
    already stored locally (university papers often have no S2 id)."""
    meta = None
    try:
        meta = s2.paper_details(corpus_id)
    except Exception:
        meta = None
    if meta and meta.get("title"):
        if not meta.get("abstract"):
            local = (db.query(SavedPaper)
                     .filter_by(tenant_id=settings.tenant_id, corpus_id=corpus_id)
                     .first())
            if local and local.abstract:
                meta = {**meta, "abstract": local.abstract}
        return meta

    saved = (db.query(SavedPaper)
             .filter_by(tenant_id=settings.tenant_id, corpus_id=corpus_id).first())
    if saved:
        return _from_saved(saved)
    uni = (db.query(UniversityPaper)
           .filter(UniversityPaper.tenant_id == settings.tenant_id)
           .filter((UniversityPaper.s2_id == corpus_id) |
                   (UniversityPaper.id == corpus_id)).first())
    if uni:
        return _from_university(uni)
    return None


def _imported_manuscript(db, user_id: str, corpus_id: str) -> Manuscript | None:
    """A ready Focus import of this paper, owned by this user — its parsed
    text/PDF is already on disk, so full-text tools cost no extra download."""
    rows = (db.query(Manuscript)
            .filter_by(tenant_id=settings.tenant_id, user_id=user_id)
            .filter(Manuscript.origin.isnot(None)).all())
    for m in rows:
        if (m.origin or {}).get("corpus_id") == corpus_id and m.status == "ready":
            return m
    return None


def _full_text(db, ms: Manuscript) -> str:
    sections = (db.query(Section).filter_by(manuscript_id=ms.id)
                .order_by(Section.order).all())
    return "\n\n".join(f"## {s.name}\n{s.text[:6000]}" for s in sections)[:MAX_TEXT_CHARS]


def _content_for(db, user_id: str, meta: dict) -> tuple[str, str]:
    """Return (content, depth). Full text when the paper is already imported,
    else the abstract. depth is surfaced so the UI can say which was used."""
    ms = _imported_manuscript(db, user_id, meta["corpus_id"])
    if ms:
        txt = _full_text(db, ms)
        if txt.strip():
            return txt, "full_text"
    parts = [meta.get("abstract") or "", meta.get("tldr") or ""]
    content = "\n\n".join(p for p in parts if p).strip()
    return content, "abstract"


# ------------------------------------------------------------------- caching

def _cache_get(db, corpus_id: str, kind: str):
    row = (db.query(PaperArtifact)
           .filter_by(tenant_id=settings.tenant_id, corpus_id=corpus_id, kind=kind)
           .first())
    return row.payload if row else None


def _cache_put(db, corpus_id: str, kind: str, payload: dict):
    row = (db.query(PaperArtifact)
           .filter_by(tenant_id=settings.tenant_id, corpus_id=corpus_id, kind=kind)
           .first())
    if row:
        row.payload = payload
    else:
        db.add(PaperArtifact(tenant_id=settings.tenant_id, corpus_id=corpus_id,
                             kind=kind, payload=payload))
    db.commit()


# --------------------------------------------------------------- text tools

_PROMPTS = {
    "summary": (
        "Summarise this paper for a researcher skimming the literature. "
        "6-8 sentences: the problem, the approach, the headline results, and why "
        "it matters. No preamble.\n\nReturn JSON: {\"text\": \"...\"}"
    ),
    "explanation": (
        "Explain this paper in plain language to a graduate student new to the "
        "area. Two short paragraphs: what it does and why the approach makes "
        "sense. Avoid jargon where possible.\n\nReturn JSON: {\"text\": \"...\"}"
    ),
    "key_concepts": (
        "Extract the key concepts, methods and terms a reader needs to "
        "understand this paper. 5-8 items.\n\nReturn JSON: "
        "{\"concepts\": [{\"term\": \"...\", \"definition\": \"one clear "
        "sentence grounded in this paper\"}]}"
    ),
    "research_gap": (
        "Identify the open problems and research gaps this paper leaves. Base "
        "them on its stated limitations and scope. 3-5 items, each actionable.\n\n"
        "Return JSON: {\"gaps\": [{\"gap\": \"short title\", \"detail\": "
        "\"1-2 sentences on the opening and why it matters\"}]}"
    ),
}


class AnalyzeBody(BaseModel):
    kind: str


def _header(meta: dict) -> str:
    return (f"TITLE: {meta.get('title')}\n"
            f"AUTHORS: {', '.join(meta.get('authors') or []) or 'unknown'}\n"
            f"VENUE/YEAR: {meta.get('venue') or 'unknown'} {meta.get('year') or ''}\n")


@router.post("/papers/{corpus_id}/analyze")
def analyze(corpus_id: str, body: AnalyzeBody, db=Depends(get_db),
            current_user: dict = Depends(get_current_user)):
    if body.kind not in TEXT_KINDS:
        raise HTTPException(400, f"kind must be one of {', '.join(TEXT_KINDS)}")
    cached = _cache_get(db, corpus_id, body.kind)
    if cached:
        return {**cached, "cached": True}

    meta = _resolve_paper(db, corpus_id)
    if not meta:
        raise HTTPException(404, "Paper not found")
    content, depth = _content_for(db, current_user["user_id"], meta)
    if not content:
        raise HTTPException(
            422, "No abstract or full text is available for this paper, so it "
                 "can't be analysed. Try opening it in Focus first.")

    prompt = f"{_header(meta)}\nPAPER {'FULL TEXT' if depth == 'full_text' else 'ABSTRACT'}:\n{content}\n\n{_PROMPTS[body.kind]}"
    try:
        result = claude.complete_json(prompt, max_tokens=1800)
    except Exception as e:
        raise HTTPException(502, f"Analysis failed: {str(e)[:120]}")

    payload = {"kind": body.kind, "corpus_id": corpus_id, "depth": depth,
               "result": result}
    _cache_put(db, corpus_id, body.kind, payload)
    return {**payload, "cached": False}


# ----------------------------------------------------------- PDF-based tools

def _resolve_pdf(db, user_id: str, corpus_id: str, meta: dict) -> tuple[str, bool]:
    """Return (path, is_temp). Reuse an already-imported Focus PDF; otherwise
    download the open-access PDF to a temp file. Raise 404 if none exists."""
    ms = _imported_manuscript(db, user_id, corpus_id)
    if ms and ms.file_path and os.path.exists(ms.file_path):
        return ms.file_path, False

    from .ingest import _download_pdf
    candidates = []
    if meta.get("open_access_pdf_url"):
        candidates.append(meta["open_access_pdf_url"])
    if meta.get("arxiv_id"):
        candidates.append(f"https://arxiv.org/pdf/{meta['arxiv_id']}")
    if not candidates:
        raise HTTPException(
            404, "No open-access PDF is available for this paper, so figures "
                 "and tables can't be extracted. You can still read its abstract.")
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    last_err = None
    for url in candidates:
        try:
            _download_pdf(url, path)
            return path, True
        except Exception as e:
            last_err = e
    try:
        os.remove(path)
    except OSError:
        pass
    raise HTTPException(502, f"Could not fetch the open-access PDF ({str(last_err)[:80]})")


@router.post("/papers/{corpus_id}/figures")
def figures(corpus_id: str, db=Depends(get_db),
            current_user: dict = Depends(get_current_user)):
    cached = _cache_get(db, corpus_id, "figures")
    if cached:
        return {**cached, "cached": True}
    meta = _resolve_paper(db, corpus_id)
    if not meta:
        raise HTTPException(404, "Paper not found")
    path, is_temp = _resolve_pdf(db, current_user["user_id"], corpus_id, meta)

    import fitz  # PyMuPDF
    figs: list[dict] = []
    try:
        doc = fitz.open(path)
        seen: set[int] = set()
        for pno in range(doc.page_count):
            if len(figs) >= MAX_FIGURES:
                break
            page = doc[pno]
            for img in page.get_images(full=True):
                if len(figs) >= MAX_FIGURES:
                    break
                xref = img[0]
                if xref in seen:
                    continue
                seen.add(xref)
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.width < MIN_FIGURE_DIM or pix.height < MIN_FIGURE_DIM:
                        continue
                    if pix.colorspace and pix.colorspace.n >= 4:  # CMYK -> RGB
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    # Downscale large scans by halving (PyMuPDF's only in-place
                    # resize) until the longest side is within the payload cap.
                    maxdim = max(pix.width, pix.height)
                    if maxdim > MAX_FIGURE_DIM:
                        factor = int(math.floor(math.log2(maxdim / MAX_FIGURE_DIM)))
                        if factor >= 1:
                            pix.shrink(factor)
                    data = pix.tobytes("png")
                    figs.append({
                        "page": pno + 1, "width": pix.width, "height": pix.height,
                        "image": "data:image/png;base64," + base64.b64encode(data).decode(),
                    })
                except Exception:
                    continue
        doc.close()
    finally:
        if is_temp:
            try:
                os.remove(path)
            except OSError:
                pass

    payload = {"corpus_id": corpus_id, "figures": figs,
               "note": None if figs else "No embedded figures were found in this PDF "
                                          "(it may be a scanned or text-only document)."}
    _cache_put(db, corpus_id, "figures", payload)
    return {**payload, "cached": False}


@router.post("/papers/{corpus_id}/tables")
def tables(corpus_id: str, db=Depends(get_db),
           current_user: dict = Depends(get_current_user)):
    cached = _cache_get(db, corpus_id, "tables")
    if cached:
        return {**cached, "cached": True}
    meta = _resolve_paper(db, corpus_id)
    if not meta:
        raise HTTPException(404, "Paper not found")
    path, is_temp = _resolve_pdf(db, current_user["user_id"], corpus_id, meta)

    import fitz  # PyMuPDF
    out: list[dict] = []
    try:
        doc = fitz.open(path)
        for pno in range(doc.page_count):
            if len(out) >= MAX_TABLES:
                break
            try:
                found = doc[pno].find_tables()
            except Exception:
                continue
            for t in found.tables:
                if len(out) >= MAX_TABLES:
                    break
                rows = t.extract()
                rows = [[("" if c is None else str(c))[:300] for c in r] for r in rows][:60]
                if not rows or all(not any(c.strip() for c in r) for r in rows):
                    continue
                out.append({"page": pno + 1, "n_rows": len(rows),
                            "n_cols": max((len(r) for r in rows), default=0),
                            "rows": rows})
        doc.close()
    finally:
        if is_temp:
            try:
                os.remove(path)
            except OSError:
                pass

    payload = {"corpus_id": corpus_id, "tables": out,
               "note": None if out else "No tables were detected in this PDF "
                                        "(detection needs a text-based, non-scanned PDF)."}
    _cache_put(db, corpus_id, "tables", payload)
    return {**payload, "cached": False}


# ------------------------------------------------------------ journal ranking

def _impact_tier(citations: int, influential: int, year: int | None) -> tuple[str, str]:
    """A transparent, citation-based ESTIMATE — not an official ranking.
    S2 exposes no SJR/quartile, so we grade by citation volume and, lightly,
    recency (a recent paper with some traction ranks up)."""
    if citations >= 1000 or influential >= 80:
        return "Highly cited", "Among the most-cited work in its area."
    if citations >= 200 or influential >= 20:
        return "Well cited", "Solid uptake by the research community."
    if citations >= 30 or influential >= 5:
        return "Moderately cited", "A meaningful but not dominant citation footprint."
    if year and citations >= 3:
        return "Emerging", "Recent work that is starting to be cited."
    return "Limited citations", "Little citation activity recorded yet."


@router.get("/papers/{corpus_id}/journal-ranking")
def journal_ranking(corpus_id: str, db=Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    cached = _cache_get(db, corpus_id, "journal_ranking")
    if cached:
        return {**cached, "cached": True}
    meta = _resolve_paper(db, corpus_id)
    if not meta:
        raise HTTPException(404, "Paper not found")

    citations = meta.get("citation_count") or 0
    influential = meta.get("influential_citation_count") or 0
    tier, blurb = _impact_tier(citations, influential, meta.get("year"))
    payload = {
        "corpus_id": corpus_id,
        "venue": meta.get("venue") or None,
        "year": meta.get("year"),
        "fields_of_study": meta.get("fields_of_study") or [],
        "metrics": {"citation_count": citations,
                    "influential_citation_count": influential},
        "impact_tier": tier,
        "impact_blurb": blurb,
        "estimated": True,
        "disclaimer": "Estimated from Semantic Scholar citation metrics. This is "
                      "not an official journal ranking (e.g. SJR quartile or "
                      "impact factor).",
    }
    _cache_put(db, corpus_id, "journal_ranking", payload)
    return {**payload, "cached": False}
