"""Local embeddings (fastembed) + Qdrant helpers. One collection per manuscript,
one collection per tenant for the university corpus. Namespaces are never mixed."""
import threading
import uuid

from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from ..config import settings

_lock = threading.Lock()
_model = None
_client = None

DIM = 384  # bge-small-en-v1.5


def get_model() -> TextEmbedding:
    global _model
    with _lock:
        if _model is None:
            _model = TextEmbedding(model_name=settings.embed_model)
    return _model


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url)
    return _client


def embed(texts: list[str]) -> list[list[float]]:
    return [v.tolist() for v in get_model().embed(texts)]


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


def search(collection: str, query: str, limit: int = 6) -> list[dict]:
    """Semantic search, dropping bibliography chunks (still present in
    collections indexed before they were excluded from chunking)."""
    client = get_client()
    if not client.collection_exists(collection):
        return []
    vec = embed([query])[0]
    res = client.query_points(collection_name=collection, query=vec,
                              limit=limit + 6, with_payload=True)
    hits = [{**p.payload, "score": p.score} for p in res.points]
    content = [h for h in hits
               if str(h.get("section", "")).lower() not in NON_CONTENT]
    return (content or hits)[:limit]
