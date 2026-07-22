export type SourceScope = "manuscript" | "university" | "public" | "derived";

export interface Manuscript {
  id: string;
  title: string;
  authors: string[];
  field_of_study: string;
  n_pages: number;
  status: "ingesting" | "ready" | "error";
  index_status?: "pending" | "indexing" | "ready" | "failed";
  ingest_steps: Record<string, string>;
  readiness: number;
  // Mixes score fields (base/insight/citations/review: number) with status
  // booleans (insight_done, citations_checked, review_done) and counts
  // (open_issues, refs_verified, refs_total) — verified against the live API.
  readiness_detail: Record<string, number | boolean>;
  source_scope: SourceScope;
  created_at: string;
  updated_at: string;
  has_insight: boolean;
  insight?: InsightBrief | null;
  sections?: { id: string; name: string; order: number; page_start: number }[];
}

export interface AnchoredClaim {
  claim: string;
  section: string;
  page: number;
  quote: string;
}

export interface InsightBrief {
  problem: AnchoredClaim;
  contribution: AnchoredClaim;
  method: AnchoredClaim;
  key_results: AnchoredClaim[];
  limitations: AnchoredClaim[];
  gap_hints: string[];
  keywords: string[];
  concepts: string[];
}

export interface Reference {
  id: string;
  raw: string;
  title: string;
  year: number | null;
  authors: string[];
  status: "verified" | "suspect" | "not_found" | "unverified";
  resolved_scope: string | null;
  corpus_id: string | null;
  resolved_meta: { title?: string; year?: number; venue?: string; url?: string; citation_count?: number } | null;
}

export interface Issue {
  id: string;
  severity: "critical" | "major" | "minor";
  category: string;
  title: string;
  description: string;
  quote: string;
  page: number | null;
  section: string;
  suggestion: string;
  evidence_note: string;
  confidence: number;
  status: "open" | "accepted" | "rejected";
}

export interface EvidenceItem {
  id: string;
  claim: string;
  kind: "insight" | "review" | "citation" | "format" | "browse";
  source_type: "public_paper" | "university_paper" | "manuscript_span";
  source_ref: unknown;
  confidence: number;
  status: "verified" | "unverified" | "conflict";
  created_at: string;
}

export interface Version {
  id: string;
  number: number;
  label: string;
  diff_summary: { issue_id: string; before: string; after: string }[];
  readiness: number;
  created_at: string;
}

export interface BrowsePaper {
  corpus_id: string;
  title: string;
  abstract: string;
  tldr: string | null;
  year: number | null;
  venue: string;
  citation_count: number;
  authors: string[];
  doi: string | null;
  open_access_pdf_url: string | null;
  url: string | null;
  source_scope: SourceScope;
  ref_index: number;
  rank_explanation: string;
  collection?: string;
}

export interface Task<T = unknown> {
  id: string;
  kind: string;
  status: "running" | "done" | "error";
  progress: number;
  step: string;
  result: T | null;
  error: string | null;
}

export interface MindMapData {
  nodes: {
    id: string;
    label: string;
    type: string;
    source_scope: SourceScope;
    year: number | null;
    cluster: string | null;
    meta: unknown;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    source_scope: SourceScope;
    relation_type: "thematic" | "citation" | "methodological";
  }[];
  gaps: string[];
}

export interface Highlight {
  page: number;
  quote: string;
  color?: "review" | "insight" | "citation";
}

export interface MapGap {
  cluster: string;
  count: number;
  paper_ids: string[];
  message: string;
}

export interface MapNode {
  id: string;
  label: string;
  type: "center" | "paper";
  source_scope: SourceScope;
  year: number | null;
  cluster?: string | null;
  why?: string | null;
  meta: unknown;
}

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  source_scope: SourceScope;
  relation_type: string;
}

export interface MindMapRecord {
  id: string;
  title: string;
  seed_type: "question" | "manuscript" | "collection";
  seed_ref: unknown;
  status: "building" | "ready" | "error";
  error: string | null;
  saved?: boolean;
  created_at: string;
  graph?: { nodes: MapNode[]; edges: MapEdge[]; gaps: MapGap[] } | null;
  n_nodes?: number;
}

export interface SavedPaper {
  id: string;
  corpus_id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  abstract: string;
  url: string | null;
  source_scope: SourceScope;
  collection: string;
  created_at: string;
  // Enriched live from Semantic Scholar on GET /library/{id} (public papers only):
  tldr?: string | null;
  citation_count?: number | null;
  open_access_pdf_url?: string | null;
}

export interface UniversityPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  s2_id: string | null;
  collection: string;
  source_scope: SourceScope;
}

// --- Paper-intelligence tools (mind-map nodes / Focus cards; keyed on corpus_id) ---
export type PaperToolKind =
  | "summary" | "key_concepts" | "explanation" | "research_gap"
  | "figures" | "tables" | "journal_ranking";

export interface PaperTextResult {
  kind: PaperToolKind;
  corpus_id: string;
  depth: "abstract" | "full_text";
  result: {
    text?: string;
    concepts?: { term: string; definition: string }[];
    gaps?: { gap: string; detail: string }[];
  };
  cached: boolean;
}

export interface PaperFigure { page: number; width: number; height: number; image: string }
export interface PaperFiguresResult {
  corpus_id: string;
  figures: PaperFigure[];
  note: string | null;
  cached: boolean;
}

export interface PaperTable { page: number; n_rows: number; n_cols: number; rows: string[][] }
export interface PaperTablesResult {
  corpus_id: string;
  tables: PaperTable[];
  note: string | null;
  cached: boolean;
}

export interface JournalRanking {
  corpus_id: string;
  venue: string | null;
  year: number | null;
  fields_of_study: string[];
  metrics: { citation_count: number; influential_citation_count: number };
  impact_tier: string;
  impact_blurb: string;
  estimated: boolean;
  disclaimer: string;
  cached: boolean;
}

export interface SearchLogItem {
  id: string;
  query: string;
  scope: string;
  n_results: number;
  created_at: string;
}
