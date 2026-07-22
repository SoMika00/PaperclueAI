"""Lazy semantic indexing + Qdrant helpers.

OpenAI is the default provider. Manuscript collections are namespaced by tenant,
user and document; payload filters repeat those boundaries as defence in depth.
FastEmbed remains an explicit offline fallback.
"""
import hashlib
import re
import threading
import uuid

import httpx
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import (Distance, FieldCondition, Filter, MatchValue,
                                  PointStruct, VectorParams)

from ..config import settings

_lock = threading.Lock()
_model = None
_client = None

DIM = settings.embed_dimensions


def _namespace(value: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_-]", "_", value or "unknown")[:36]
    digest = hashlib.sha256((value or "unknown").encode()).hexdigest()[:8]
    return f"{clean}_{digest}"


def manuscript_collection(user_id: str, manuscript_id: str) -> str:
    space = _namespace(f"{settings.embedding_provider}:{settings.embed_model}:{DIM}")
    return f"ms_{space}_{_namespace(settings.tenant_id)}_{_namespace(user_id)}_{manuscript_id}"


def tenant_collection(prefix: str = "uni") -> str:
    space = _namespace(f"{settings.embedding_provider}:{settings.embed_model}:{DIM}")
    return f"{prefix}_{space}_{_namespace(settings.tenant_id)}"


def get_model() -> TextEmbedding:
    global _model
    with _lock:
        if _model is None:
            if settings.embedding_provider != "fastembed":
                raise RuntimeError("Local embedding model requested while provider is not fastembed")
            _model = TextEmbedding(model_name=settings.embed_model)
    return _model


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url)
    return _client


def embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if settings.embedding_provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for semantic indexing")
        with httpx.Client(timeout=45) as client:
            response = client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": settings.embed_model, "dimensions": DIM, "input": texts},
            )
        response.raise_for_status()
        rows = sorted(response.json()["data"], key=lambda row: row["index"])
        return [row["embedding"] for row in rows]
    if settings.embedding_provider == "fastembed":
        return [v.tolist() for v in get_model().embed(texts)]
    raise RuntimeError(f"Unsupported embedding provider: {settings.embedding_provider}")


def ensure_collection(name: str):
    client = get_client()
    if not client.collection_exists(name):
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
        )


def upsert_chunks(collection: str, chunks: list[dict], batch_size: int = 48):
    """chunks: [{text, page, section, ...payload}]. Batched so indexing large
    documents never holds memory or blocks in one giant call."""
    ensure_collection(collection)
    client = get_client()
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        vectors = embed([c["text"] for c in batch])
        points = [
            PointStruct(id=uuid.uuid4().hex, vector=v, payload=c)
            for c, v in zip(batch, vectors)
        ]
        client.upsert(collection_name=collection, points=points)


NON_CONTENT = {"references", "bibliography", "acknowledgements", "acknowledgments"}


def search(collection: str, query: str, limit: int = 6, *,
           tenant_id: str | None = None, user_id: str | None = None) -> list[dict]:
    """Semantic search, dropping bibliography chunks (still present in
    collections indexed before they were excluded from chunking)."""
    client = get_client()
    if not client.collection_exists(collection):
        return []
    vec = embed([query])[0]
    conditions = []
    if tenant_id:
        conditions.append(FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id)))
    if user_id:
        conditions.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
    query_filter = Filter(must=conditions) if conditions else None
    res = client.query_points(collection_name=collection, query=vec,
                              query_filter=query_filter, limit=limit + 6,
                              with_payload=True)
    hits = [{**p.payload, "score": p.score} for p in res.points]
    content = [h for h in hits
               if str(h.get("section", "")).lower() not in NON_CONTENT]
    return (content or hits)[:limit]


def _section_chunks(sections, tenant_id: str, user_id: str,
                    size: int = 900, overlap: int = 150) -> list[dict]:
    chunks = []
    for section in sections:
        if section.name.lower() in NON_CONTENT:
            continue
        text = re.sub(r"\s+", " ", section.text or "").strip()
        for start in range(0, len(text), size - overlap):
            piece = text[start:start + size]
            if len(piece) > 100:
                chunks.append({
                    "text": piece, "page": section.page_start,
                    "section": section.name, "tenant_id": tenant_id,
                    "user_id": user_id,
                })
    return chunks


def ensure_manuscript_index(db, manuscript, user_id: str) -> bool:
    """Build a private document index only when a semantic feature needs it."""
    if manuscript.user_id != user_id or manuscript.tenant_id != settings.tenant_id:
        raise PermissionError("Manuscript namespace mismatch")
    collection = manuscript_collection(user_id, manuscript.id)
    if manuscript.index_status == "ready" and get_client().collection_exists(collection):
        manuscript.qdrant_collection = collection
        return True

    from ..models import Section

    manuscript.index_status = "indexing"
    manuscript.qdrant_collection = collection
    db.commit()
    try:
        if get_client().collection_exists(collection):
            get_client().delete_collection(collection)
        sections = (db.query(Section).filter_by(manuscript_id=manuscript.id)
                    .order_by(Section.order).all())
        chunks = _section_chunks(sections, manuscript.tenant_id, user_id)
        if chunks:
            upsert_chunks(collection, chunks, batch_size=48)
        manuscript.index_status = "ready"
        steps = dict(manuscript.ingest_steps or {})
        steps["indexing"] = "done"
        manuscript.ingest_steps = steps
        db.commit()
        return True
    except Exception:
        db.rollback()
        manuscript.index_status = "failed"
        db.commit()
        return False
