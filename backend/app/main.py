import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db import Base, engine
from .routers import (admin, browse, connection, ingest, insight,
                      journal_format, library, manuscripts, mindmap,
                      mindmaps, review)


def _migrate():
    """Additive column migrations (create_all never alters existing tables)."""
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS "
            "index_status VARCHAR DEFAULT 'ready'"
        ))
        conn.execute(text(
            "ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS "
            "saved BOOLEAN DEFAULT FALSE"
        ))
        conn.execute(text(
            "ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS origin JSON"
        ))
        conn.execute(text(
            "ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))
        conn.execute(text(
            "ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))
        conn.execute(text(
            "ALTER TABLE saved_papers ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))
        conn.execute(text(
            "ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))
        conn.execute(text(
            "ALTER TABLE saved_papers ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))
        conn.execute(text(
            "ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR"
        ))


def _warmup():
    """Heavy startup work runs OFF the request path: the API answers
    immediately while the embedding model loads and the corpus seeds."""
    try:
        from .services import embeddings
        embeddings.get_model()
    except Exception as e:
        print(f"embed model warmup failed: {e}")
    try:
        from .seed_university import seed
        seed()
    except Exception as e:
        print(f"seed skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate()
    threading.Thread(target=_warmup, daemon=True).start()
    yield


app = FastAPI(title="PaperClue API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

for r in (ingest, manuscripts, insight, browse, review, mindmap, mindmaps,
          library, journal_format, admin, connection):
    app.include_router(r.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "paperclue-api"}
