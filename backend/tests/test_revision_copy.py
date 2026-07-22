from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db import Base
from backend.app.models import Issue, Manuscript, Section
from backend.app.routers.review import _apply_section_fix, _create_revision_copy


def test_revision_copy_preserves_source_and_applies_fix(tmp_path, monkeypatch):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, expire_on_commit=False)()
    monkeypatch.setattr("backend.app.routers.review.settings.storage_dir", str(tmp_path))

    source_pdf = tmp_path / "source.pdf"
    source_pdf.write_bytes(b"%PDF-source")
    source = Manuscript(
        tenant_id="demo-university", user_id="user-a", title="Official Paper",
        file_path=str(source_pdf), status="ready", index_status="pending",
        origin={"from": "public", "corpus_id": "paper-1"},
    )
    db.add(source)
    db.flush()
    section = Section(manuscript_id=source.id, name="Introduction", order=0,
                      page_start=1, text="This sentence needs improvement.")
    issue = Issue(manuscript_id=source.id, severity="minor", category="clarity",
                  title="Improve sentence", description="", section="Introduction",
                  page=1, quote="This sentence needs improvement.",
                  suggestion="This sentence is now clearer.", confidence=0.9,
                  status="open")
    db.add_all([section, issue])
    db.commit()

    revision, cloned_issue = _create_revision_copy(db, source, issue.id)
    applied = _apply_section_fix(db, revision, cloned_issue, issue.suggestion)
    db.commit()

    assert applied is True
    assert revision.id != source.id
    assert revision.title.startswith("Revision Copy —")
    assert revision.source_scope == "derived"
    assert revision.origin["working_copy_of"] == source.id
    assert revision.file_path != source.file_path
    assert source_pdf.read_bytes() == b"%PDF-source"
    assert db.query(Section).filter_by(manuscript_id=source.id).one().text == \
        "This sentence needs improvement."
    assert db.query(Section).filter_by(manuscript_id=revision.id).one().text == \
        "This sentence is now clearer."
