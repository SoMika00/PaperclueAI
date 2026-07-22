import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Deployed edge functions — contracts verified against the actual
 * function sources (paperclue-backend repo, downloaded 2026-07-15).
 * Every function returns parsed JSON directly (NOT a raw Anthropic
 * message); if the model output failed JSON parsing server-side, the
 * response is `{ raw_response: string }` instead.
 */
export type EdgeFunctionName =
  | 'mind-map'
  | 'paper-insights'
  | 'manuscript-ingestion'
  | 'proofreading'
  | 'journal-formatting'

export type ScoreWithJustification = { score: number; justification: string }

export type PaperInsightsResponse = {
  scores?: Record<string, ScoreWithJustification>
  overall_summary?: string
  raw_response?: string
}

export type ProofreadingResponse = {
  grammar_issues?: number
  clarity_score?: number
  passive_voice_ratio?: string
  missing_transitions?: string[]
  section_feedback?: Record<string, string>
  raw_response?: string
}

export type ManuscriptResponse = {
  readiness_score?: {
    publication_readiness?: ScoreWithJustification
    submission_readiness?: ScoreWithJustification
  }
  reviewer_concerns?: string[]
  research_gap_analysis?: {
    paragraphs_support_research_question?: string
    discussion_answers_objectives?: string
    conclusions_supported_by_findings?: string
    citation_flags?: string[]
  }
  overlap_flags?: { overlap_detected?: boolean; notes?: string }
  raw_response?: string
}

export type JournalMatchResponse = {
  top_match?: string
  fit_score?: number
  scope_alignment?: string
  justification?: string
  alternatives?: string[]
  status?: string
  raw_response?: string
}

export type MindMapAnalyzeResponse = {
  summary?: string
  key_concepts?: string[]
  research_gaps?: string[]
  explanation?: string
  key_findings?: string[]
  related_directions?: string[]
  raw_response?: string
}

/**
 * Calls an edge function with the user's session JWT. Throws:
 * 'NO_SESSION', 'RATE_LIMITED', or 'EDGE_FUNCTION_ERROR <status> ...'.
 */
export async function callEdgeFunction<T = unknown>(
  name: EdgeFunctionName,
  body: Record<string, unknown>
): Promise<T> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('NO_SESSION')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (response.status === 429) {
    throw new Error('RATE_LIMITED')
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300)
    throw new Error(`EDGE_FUNCTION_ERROR ${response.status} on ${name}: ${detail}`)
  }

  return response.json()
}

/** keywords mode: topic → keyword clusters. */
export async function generateMindMap(topic: string) {
  return callEdgeFunction('mind-map', { topic })
}

/** analyze mode: title + abstract → summary, concepts, gaps, findings. */
export async function analyzePaper(title: string, abstract: string) {
  return callEdgeFunction<MindMapAnalyzeResponse>('mind-map', {
    mode: 'analyze',
    title,
    abstract,
  })
}
