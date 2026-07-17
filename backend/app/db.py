from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

# The optional SOURCE_DATABASE_* connection (an external data source, distinct
# from the app's own `database_url`) is built on demand by the connections
# router/service — never here at import time, since it's unconfigured by
# default and must not block API startup.

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
