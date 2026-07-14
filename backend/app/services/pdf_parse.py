"""PDF parsing: page text extraction, heuristic section split, chunking."""
import re

import fitz  # PyMuPDF

SECTION_PAT = re.compile(
    r"^\s*(?:\d+\.?\s+)?(abstract|introduction|related work|background|"
    r"method(?:s|ology)?|approach|model|experiments?|experimental setup|"
    r"results?(?: and discussion)?|discussion|analysis|evaluation|"
    r"conclusions?|limitations|acknowledg(?:e)?ments?|references|bibliography|appendix)\b",
    re.IGNORECASE,
)


def extract_pages(path: str) -> list[str]:
    doc = fitz.open(path)
    # NUL bytes appear in some PDFs' text layer and are rejected by Postgres.
    pages = [page.get_text("text").replace("\x00", "") for page in doc]
    doc.close()
    return pages


def guess_title(pages: list[str]) -> str:
    for line in pages[0].splitlines():
        line = line.strip()
        if len(line) > 15 and not line.lower().startswith(("arxiv", "preprint", "under review")):
            return line[:200]
    return "Untitled manuscript"


def split_sections(pages: list[str]) -> list[dict]:
    """Return [{name, order, page_start, text}] using heading heuristics."""
    sections, current = [], {"name": "Front matter", "page_start": 1, "lines": []}
    for pno, text in enumerate(pages, start=1):
        for line in text.splitlines():
            m = SECTION_PAT.match(line.strip())
            if m and len(line.strip()) < 60:
                if current["lines"]:
                    sections.append(current)
                current = {"name": m.group(1).title(), "page_start": pno, "lines": []}
            else:
                current["lines"].append(line)
    sections.append(current)
    return [
        {"name": s["name"], "order": i, "page_start": s["page_start"],
         "text": "\n".join(s["lines"]).strip()}
        for i, s in enumerate(sections) if s["lines"]
    ]


def extract_reference_block(sections: list[dict]) -> str:
    for s in sections:
        if s["name"].lower() in ("references", "bibliography"):
            return s["text"][:20000]
    return ""


NON_CONTENT_SECTIONS = {"references", "bibliography", "acknowledgements",
                        "acknowledgments"}


def chunk_pages(pages: list[str], sections: list[dict], size: int = 900, overlap: int = 150) -> list[dict]:
    """Chunk per page, tagging each chunk with its page + enclosing section.
    Bibliography/acknowledgements are skipped: they drown semantic retrieval
    in citation strings without ever answering a question."""
    def section_for(pno: int) -> str:
        name = "Front matter"
        for s in sections:
            if s["page_start"] <= pno:
                name = s["name"]
        return name

    chunks = []
    for pno, text in enumerate(pages, start=1):
        section = section_for(pno)
        if section.lower() in NON_CONTENT_SECTIONS:
            continue
        text = re.sub(r"\s+", " ", text).strip()
        i = 0
        while i < len(text):
            piece = text[i:i + size]
            if len(piece) > 100:
                chunks.append({"text": piece, "page": pno, "section": section})
            i += size - overlap
    return chunks
