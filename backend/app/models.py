import uuid
from datetime import datetime, timezone

from sqlalchemy import (JSON, Boolean, Column, DateTime, Float, ForeignKey,
                        Integer, String, Text)
from sqlalchemy.orm import relationship

from .db import Base


def uid() -> str:
    return uuid.uuid4().hex[:12]


def now():
    return datetime.now(timezone.utc)


class Manuscript(Base):
    __tablename__ = "manuscripts"
    id = Column(String, primary_key=True, default=uid)
    tenant_id = Column(String, nullable=False, index=True)
    title = Column(String, default="Untitled manuscript")
    authors = Column(JSON, default=list)
    field_of_study = Column(String, default="")
    file_path = Column(String, nullable=False)
    n_pages = Column(Integer, default=0)
    language = Column(String, default="en")
    status = Column(String, default="ingesting")  # ingesting | ready | error
    index_status = Column(String, default="pending")  # pending | indexing | ready | failed
    ingest_steps = Column(JSON, default=dict)
    qdrant_collection = Column(String, default="")
    source_scope = Column(String, default="manuscript")
    readiness = Column(Integer, default=0)
    readiness_detail = Column(JSON, default=dict)
    insight = Column(JSON, nullable=True)  # cached structured brief
    created_at = Column(DateTime(timezone=True), default=now)
    updated_at = Column(DateTime(timezone=True), default=now, onupdate=now)

    sections = relationship("Section", back_populates="manuscript", cascade="all,delete")
    references = relationship("Reference", back_populates="manuscript", cascade="all,delete")
    issues = relationship("Issue", back_populates="manuscript", cascade="all,delete")
    versions = relationship("Version", back_populates="manuscript", cascade="all,delete")
    evidence = relationship("EvidenceItem", back_populates="manuscript", cascade="all,delete")


class Section(Base):
    __tablename__ = "sections"
    id = Column(String, primary_key=True, default=uid)
    manuscript_id = Column(String, ForeignKey("manuscripts.id"), index=True)
    name = Column(String)          # Abstract, Introduction, Methods...
    order = Column(Integer)
    page_start = Column(Integer, default=1)
    text = Column(Text, default="")
    manuscript = relationship("Manuscript", back_populates="sections")


class Reference(Base):
    __tablename__ = "references"
    id = Column(String, primary_key=True, default=uid)
    manuscript_id = Column(String, ForeignKey("manuscripts.id"), index=True)
    raw = Column(Text)
    title = Column(String, default="")
    year = Column(Integer, nullable=True)
    authors = Column(JSON, default=list)
    status = Column(String, default="unverified")  # verified | suspect | not_found | unverified
    resolved_scope = Column(String, nullable=True)  # university | public
    corpus_id = Column(String, nullable=True)       # S2 paperId
    resolved_meta = Column(JSON, nullable=True)
    manuscript = relationship("Manuscript", back_populates="references")


class Issue(Base):
    __tablename__ = "issues"
    id = Column(String, primary_key=True, default=uid)
    manuscript_id = Column(String, ForeignKey("manuscripts.id"), index=True)
    severity = Column(String)      # critical | major | minor
    category = Column(String)      # grammar | citation | methodology | clarity | structure | ai_risk
    title = Column(String)
    description = Column(Text)
    quote = Column(Text, default="")       # exact text from manuscript (anchor)
    page = Column(Integer, nullable=True)
    section = Column(String, default="")
    suggestion = Column(Text, default="")
    evidence_note = Column(Text, default="")
    confidence = Column(Float, default=0.7)
    status = Column(String, default="open")  # open | accepted | rejected
    manuscript = relationship("Manuscript", back_populates="issues")


class Version(Base):
    __tablename__ = "versions"
    id = Column(String, primary_key=True, default=uid)
    manuscript_id = Column(String, ForeignKey("manuscripts.id"), index=True)
    number = Column(Integer)
    label = Column(String)
    diff_summary = Column(JSON, default=list)  # list of {issue_id, before, after}
    readiness = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now)
    manuscript = relationship("Manuscript", back_populates="versions")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"
    id = Column(String, primary_key=True, default=uid)
    manuscript_id = Column(String, ForeignKey("manuscripts.id"), index=True)
    claim = Column(Text)
    kind = Column(String)          # insight | review | citation | format | browse
    source_type = Column(String)   # public_paper | university_paper | manuscript_span
    source_ref = Column(JSON)      # {corpus_id,title,url} or {page,quote,section}
    confidence = Column(Float, default=0.8)
    status = Column(String, default="verified")  # verified | unverified | conflict
    created_at = Column(DateTime(timezone=True), default=now)
    manuscript = relationship("Manuscript", back_populates="evidence")


class UniversityPaper(Base):
    __tablename__ = "university_papers"
    id = Column(String, primary_key=True, default=uid)
    tenant_id = Column(String, nullable=False, index=True)
    collection_name = Column(String, default="Computer Science Dept.")
    title = Column(String)
    abstract = Column(Text, default="")
    authors = Column(JSON, default=list)
    year = Column(Integer, nullable=True)
    venue = Column(String, default="")
    doi = Column(String, nullable=True)
    s2_id = Column(String, nullable=True)
    source_scope = Column(String, default="university")


class MindMap(Base):
    __tablename__ = "mindmaps"
    id = Column(String, primary_key=True, default=uid)
    tenant_id = Column(String, nullable=False, index=True)
    saved = Column(Boolean, default=False)  # user chooses to keep a map
    title = Column(String, default="Untitled map")
    seed_type = Column(String)     # question | manuscript | collection
    seed_ref = Column(JSON, default=dict)   # {question} | {manuscript_id} | {paper_ids}
    status = Column(String, default="building")  # building | ready | error
    error = Column(String, nullable=True)
    graph = Column(JSON, nullable=True)     # {nodes, edges, gaps}
    created_at = Column(DateTime(timezone=True), default=now)
    updated_at = Column(DateTime(timezone=True), default=now, onupdate=now)


class SavedPaper(Base):
    __tablename__ = "saved_papers"
    id = Column(String, primary_key=True, default=uid)
    tenant_id = Column(String, nullable=False, index=True)
    collection = Column(String, default="Saved papers")
    corpus_id = Column(String, index=True)
    title = Column(String)
    authors = Column(JSON, default=list)
    year = Column(Integer, nullable=True)
    venue = Column(String, default="")
    abstract = Column(Text, default="")
    url = Column(String, nullable=True)
    source_scope = Column(String, default="public")
    created_at = Column(DateTime(timezone=True), default=now)


class SearchLog(Base):
    __tablename__ = "search_logs"
    id = Column(String, primary_key=True, default=uid)
    tenant_id = Column(String, nullable=False, index=True)
    query = Column(Text)
    scope = Column(String, default="combined")
    n_results = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now)
