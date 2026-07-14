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
  readiness_detail: Record<string, number>;
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
  source_ref: any;
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

export interface Task<T = any> {
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
    meta: any;
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
  meta: any;
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
  seed_ref: any;
  status: "building" | "ready" | "error";
  error: string | null;
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
}

export interface SearchLogItem {
  id: string;
  query: string;
  scope: string;
  n_results: number;
  created_at: string;
}
