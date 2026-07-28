import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Quick Tools backends. `proofreading`, `paper-insights` and
 * `journal-formatting` now run locally (backend/app/routers/quick_tools.py);
 * `mind-map` and `manuscript-ingestion` are still deployed Supabase edge
 * functions. Every function returns parsed JSON directly (NOT a raw
 * Anthropic message); if the model output failed JSON parsing server-side,
 * the response is `{ raw_response: string }`.
 */
export type EdgeFunctionName =
  | "mind-map"
  | "paper-insights"
  | "manuscript-ingestion"
  | "proofreading"
  | "journal-formatting";

/** Migrated tools: served locally instead of via a Supabase edge function. */
const LOCAL_PATHS: Partial<Record<EdgeFunctionName, string>> = {
  proofreading: "/api/quick/proofreading",
  "paper-insights": "/api/quick/paper-insights",
  "journal-formatting": "/api/quick/journal-formatting",
};

export type ScoreWithJustification = { score: number; justification: string };

export type PaperInsightsResponse = {
  scores?: Record<string, ScoreWithJustification>;
  overall_summary?: string;
  raw_response?: string;
};

export type ProofreadingResponse = {
  grammar_issues?: number;
  clarity_score?: number;
  passive_voice_ratio?: string;
  missing_transitions?: string[];
  section_feedback?: Record<string, string>;
  raw_response?: string;
};

export type ManuscriptResponse = {
  readiness_score?: {
    publication_readiness?: ScoreWithJustification;
    submission_readiness?: ScoreWithJustification;
  };
  reviewer_concerns?: string[];
  research_gap_analysis?: {
    paragraphs_support_research_question?: string;
    discussion_answers_objectives?: string;
    conclusions_supported_by_findings?: string;
    citation_flags?: string[];
  };
  overlap_flags?: { overlap_detected?: boolean; notes?: string };
  raw_response?: string;
};

export type JournalMatchResponse = {
  top_match?: string;
  fit_score?: number;
  scope_alignment?: string;
  justification?: string;
  alternatives?: string[];
  status?: string;
  raw_response?: string;
};

export type MindMapAnalyzeResponse = {
  summary?: string;
  key_concepts?: string[];
  research_gaps?: string[];
  explanation?: string;
  key_findings?: string[];
  related_directions?: string[];
  raw_response?: string;
};

/**
 * Calls an edge function with the user's session JWT. Throws:
 * 'NO_SESSION', 'RATE_LIMITED', or 'EDGE_FUNCTION_ERROR <status> ...'.
 */
export async function callEdgeFunction<T = unknown>(
  name: EdgeFunctionName,
  body: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("NO_SESSION");
  }

  const localPath = LOCAL_PATHS[name];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
  if (!localPath) headers.apikey = SUPABASE_ANON_KEY;

  const response = await fetch(localPath ?? `${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`EDGE_FUNCTION_ERROR ${response.status} on ${name}: ${detail}`);
  }

  return response.json();
}

/** keywords mode: topic → keyword clusters. */
export async function generateMindMap(topic: string) {
  return callEdgeFunction("mind-map", { topic });
}

/** analyze mode: title + abstract → summary, concepts, gaps, findings. */
export async function analyzePaper(title: string, abstract: string) {
  return callEdgeFunction<MindMapAnalyzeResponse>("mind-map", {
    mode: "analyze",
    title,
    abstract,
  });
}
