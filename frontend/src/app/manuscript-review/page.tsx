'use client'

import { GatedToolPage } from '@/components/GatedToolPage'
import { BulletList, LabeledRow, ScoreBar } from '@/components/ResultParts'
import type { ManuscriptResponse } from '@/lib/edge-functions'
import { splitIntoSections } from '@/lib/sections'

const ORANGE = '#e8862f'

function ManuscriptResult(data: Record<string, unknown>) {
  const res = data as ManuscriptResponse
  const scores = res.readiness_score
  if (!scores && !res.reviewer_concerns) return null

  const gap = res.research_gap_analysis

  return (
    <div>
      {scores?.publication_readiness && typeof scores.publication_readiness.score === 'number' && (
        <ScoreBar
          label="Publication readiness"
          score={scores.publication_readiness.score}
          justification={scores.publication_readiness.justification}
        />
      )}
      {scores?.submission_readiness && typeof scores.submission_readiness.score === 'number' && (
        <ScoreBar
          label="Submission readiness"
          score={scores.submission_readiness.score}
          justification={scores.submission_readiness.justification}
        />
      )}

      {res.reviewer_concerns && res.reviewer_concerns.length > 0 && (
        <LabeledRow label="Concerns" color={ORANGE}>
          <BulletList items={res.reviewer_concerns} />
        </LabeledRow>
      )}

      {gap?.paragraphs_support_research_question && (
        <LabeledRow label="Question" color={ORANGE}>
          {gap.paragraphs_support_research_question}
        </LabeledRow>
      )}
      {gap?.discussion_answers_objectives && (
        <LabeledRow label="Discussion" color={ORANGE}>
          {gap.discussion_answers_objectives}
        </LabeledRow>
      )}
      {gap?.conclusions_supported_by_findings && (
        <LabeledRow label="Conclusions" color={ORANGE}>
          {gap.conclusions_supported_by_findings}
        </LabeledRow>
      )}
      {gap?.citation_flags && gap.citation_flags.length > 0 && (
        <LabeledRow label="Citations" color={ORANGE}>
          <BulletList items={gap.citation_flags} />
        </LabeledRow>
      )}

      {res.overlap_flags && (
        <LabeledRow label="Overlap" color={ORANGE}>
          {res.overlap_flags.overlap_detected
            ? `Possible overlap detected — ${res.overlap_flags.notes ?? 'review the flagged passages.'}`
            : res.overlap_flags.notes ?? 'No overlap concerns detected in the provided text.'}
        </LabeledRow>
      )}
    </div>
  )
}

export default function ManuscriptReviewPage() {
  return (
    <GatedToolPage
      toolId="manuscript"
      edgeFunction="manuscript-ingestion"
      requiresDocument
      renderResult={ManuscriptResult}
      buildBody={(prompt, doc) => {
        const sections = splitIntoSections(doc!.text, doc!.filename)
        return {
          sections: prompt.trim() ? { ...sections, review_focus: prompt } : sections,
          filename: doc!.filename,
        }
      }}
    />
  )
}
