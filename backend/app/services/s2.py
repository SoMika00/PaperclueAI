"""Semantic Scholar API client - the public grounding layer.
Keyless-friendly: a global throttle (1 in-flight request, min spacing), an
in-memory TTL cache, 8-9s timeouts and bounded retries. Callers tolerate
partial results; Claude only ever sees what was actually retrieved."""
import threading
import time

import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from ..config import settings

BASE = "https://api.semanticscholar.org/graph/v1"
FIELDS = "paperId,title,abstract,year,venue,citationCount,influentialCitationCount,authors,externalIds,openAccessPdf,tldr,fieldsOfStudy"
TIMEOUT = 9.0

TTL_SEARCH = 24 * 3600       # search results: 24 h
TTL_META = 7 * 24 * 3600     # paper metadata / recommendations: 7 days

_cache: dict[str, tuple[float, object]] = {}
_cache_lock = threading.Lock()
_call_lock = threading.Lock()   # 1 concurrent request max (keyless shared pool)
_last_call = 0.0
MIN_INTERVAL = 1.2


def _headers():
    return {"x-api-key": settings.s2_api_key} if settings.s2_api_key else {}


def _cached(key: str, ttl: int, fn):
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    result = fn()
    with _cache_lock:
        _cache[key] = (time.time(), result)
        if len(_cache) > 2000:  # crude eviction
            for k, _ in sorted(_cache.items(), key=lambda kv: kv[1][0])[:500]:
                _cache.pop(k, None)
    return result


def _throttled(method: str, url: str, params: dict, json_body: dict | None = None) -> httpx.Response:
    global _last_call
    with _call_lock:
        wait = MIN_INTERVAL - (time.time() - _last_call)
        if wait > 0:
            time.sleep(wait)
        try:
            with httpx.Client(timeout=TIMEOUT) as c:
                if method == "POST":
                    return c.post(url, params=params, json=json_body, headers=_headers())
                return c.get(url, params=params, headers=_headers())
        finally:
            _last_call = time.time()


def _norm(p: dict) -> dict:
    return {
        "corpus_id": p.get("paperId"),
        "title": p.get("title") or "",
        "abstract": p.get("abstract") or "",
        "tldr": (p.get("tldr") or {}).get("text") if isinstance(p.get("tldr"), dict) else None,
        "year": p.get("year"),
        "venue": p.get("venue") or "",
        "citation_count": p.get("citationCount") or 0,
        "influential_citation_count": p.get("influentialCitationCount") or 0,
        "authors": [a.get("name") for a in (p.get("authors") or [])][:8],
        "doi": (p.get("externalIds") or {}).get("DOI"),
        "open_access_pdf_url": (p.get("openAccessPdf") or {}).get("url"),
        "fields_of_study": p.get("fieldsOfStudy") or [],
        "url": f"https://www.semanticscholar.org/paper/{p.get('paperId')}",
        "source_scope": "public",
    }


def _retryable(e: BaseException) -> bool:
    if isinstance(e, httpx.HTTPStatusError):
        return e.response.status_code in (429, 500, 502, 503)
    return isinstance(e, (httpx.TimeoutException, httpx.TransportError))


_retry = retry(stop=stop_after_attempt(3),
               wait=wait_exponential(min=2, max=12),
               retry=retry_if_exception(_retryable))


@_retry
def _search_raw(query: str, limit: int, year_from: int | None) -> list[dict]:
    params = {"query": query, "limit": limit, "fields": FIELDS}
    if year_from:
        params["year"] = f"{year_from}-"
    r = _throttled("GET", f"{BASE}/paper/search", params)
    r.raise_for_status()
    return [_norm(p) for p in r.json().get("data", [])]


def search(query: str, limit: int = 10, year_from: int | None = None) -> list[dict]:
    key = f"search:{query.lower()[:200]}:{limit}:{year_from}"
    return _cached(key, TTL_SEARCH, lambda: _search_raw(query, limit, year_from))


@_retry
def _match_raw(title: str) -> dict | None:
    r = _throttled("GET", f"{BASE}/paper/search/match",
                   {"query": title, "fields": FIELDS})
    if r.status_code == 404:
        return None
    r.raise_for_status()
    data = r.json().get("data") or []
    if not data:
        return None
    best = data[0]
    out = _norm(best)
    out["match_score"] = best.get("matchScore")
    return out


def match_title(title: str) -> dict | None:
    key = f"match:{title.lower()[:200]}"
    return _cached(key, TTL_META, lambda: _match_raw(title))


@_retry
def _recs_raw(paper_ids: list[str], limit: int) -> list[dict]:
    r = _throttled(
        "POST", "https://api.semanticscholar.org/recommendations/v1/papers",
        {"fields": FIELDS, "limit": limit},
        {"positivePaperIds": paper_ids[:10]},
    )
    r.raise_for_status()
    return [_norm(p) for p in r.json().get("recommendedPapers", [])]


def recommendations(paper_ids: list[str], limit: int = 10) -> list[dict]:
    key = f"recs:{','.join(sorted(paper_ids[:10]))}:{limit}"
    return _cached(key, TTL_META, lambda: _recs_raw(paper_ids, limit))
