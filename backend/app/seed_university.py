"""Seed the demo university corpus: fetch a handful of real OA papers from
Semantic Scholar, store meta in Postgres (tenant-scoped) and embed abstracts
into the tenant's dedicated Qdrant collection. Run once at startup (idempotent)."""
from .config import settings
from .db import Base, SessionLocal, engine
from .models import UniversityPaper
from .services import embeddings, s2

UNI_COLLECTION = f"uni_{settings.tenant_id}"

SEED_QUERIES = [
    ("retrieval augmented generation evaluation", "NLP Lab"),
    ("large language model hallucination detection", "NLP Lab"),
    ("dense passage retrieval question answering", "NLP Lab"),
    ("scientific literature citation analysis", "Scientometrics Group"),
    ("peer review quality assessment", "Scientometrics Group"),
    ("transformer attention interpretability", "ML Theory Group"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(UniversityPaper).filter_by(tenant_id=settings.tenant_id).count()
        if existing >= 10:
            print(f"University corpus already seeded ({existing} papers).")
            return
        known_ids = {r.s2_id for r in
                     db.query(UniversityPaper).filter_by(tenant_id=settings.tenant_id).all()}
        chunks, count = [], 0
        for query, collection_name in SEED_QUERIES:
            try:
                papers = s2.search(query, limit=3)
            except Exception as e:
                print(f"seed query failed: {e}")
                continue
            for p in papers:
                if not p.get("abstract") or p.get("corpus_id") in known_ids:
                    continue
                # The datalake must be openable in Focus: full text required.
                if not (p.get("open_access_pdf_url") or p.get("arxiv_id")):
                    continue
                known_ids.add(p.get("corpus_id"))
                up = UniversityPaper(
                    tenant_id=settings.tenant_id, collection_name=collection_name,
                    title=p["title"], abstract=p["abstract"],
                    authors=p["authors"], year=p.get("year"),
                    venue=p.get("venue") or "", doi=p.get("doi"),
                    s2_id=p["corpus_id"],
                )
                db.add(up)
                db.flush()
                chunks.append({
                    "text": f"{p['title']}. {p['abstract'][:1200]}",
                    "paper_id": up.id, "tenant_id": settings.tenant_id,
                    "page": 0, "section": collection_name,
                })
                count += 1
        db.commit()
        if chunks:
            embeddings.upsert_chunks(UNI_COLLECTION, chunks)
        print(f"Seeded {count} university papers into {UNI_COLLECTION}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
