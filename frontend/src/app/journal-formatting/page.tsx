'use client'

import { GatedToolPage } from '@/components/GatedToolPage'
import { BulletList, LabeledRow, scoreColor } from '@/components/ResultParts'
import type { JournalMatchResponse } from '@/lib/edge-functions'
import { splitIntoSections } from '@/lib/sections'

const TEAL = '#0f9b8e'

function JournalResult(data: Record<string, unknown>) {
  const res = data as JournalMatchResponse

  // Semantic Scholar found no venues for this topic.
  if (res.status && !res.top_match) {
    return (
      <p className="text-[13.5px] text-muted leading-relaxed py-2">{res.status}</p>
    )
  }
  if (!res.top_match) return null

  return (
    <div>
      <div className="flex items-center gap-3 py-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold tracking-[1px] text-muted-light mb-0.5">
            BEST FIT
          </div>
          <div className="text-[16px] font-bold text-ink">{res.top_match}</div>
        </div>
        {typeof res.fit_score === 'number' && (
          <span
            className="text-[15px] font-bold whitespace-nowrap rounded-full px-3.5 py-1.5"
            style={{ color: scoreColor(res.fit_score), background: '#e0f7f4' }}
          >
            fit {res.fit_score}/10
          </span>
        )}
      </div>
      {res.scope_alignment && (
        <LabeledRow label="Scope" color={TEAL}>
          {res.scope_alignment} alignment with this venue&rsquo;s published topics
        </LabeledRow>
      )}
      {res.justification && (
        <LabeledRow label="Why" color={TEAL}>
          {res.justification}
        </LabeledRow>
      )}
      {res.alternatives && res.alternatives.length > 0 && (
        <LabeledRow label="Alternatives" color={TEAL}>
          <BulletList items={res.alternatives} />
        </LabeledRow>
      )}
      <p className="text-[11.5px] text-muted-light pt-3">
        Fit is inferred from real papers published in each venue (via Semantic Scholar) — it is
        not an acceptance probability.
      </p>
    </div>
  )
}

export default function JournalFormattingPage() {
  return (
    <GatedToolPage
      toolId="journal"
      edgeFunction="journal-formatting"
      requiresDocument
      renderResult={JournalResult}
      buildBody={(prompt, doc) => {
        // Only bibliographic metadata leaves the client — never full text.
        const sections = splitIntoSections(doc!.text, doc!.filename)
        return {
          title: sections.title ?? doc!.filename,
          abstract: (sections.abstract ?? doc!.text.slice(0, 2000)).slice(0, 4000),
          keywords: prompt
            .split(/[,;]/)
            .map((k) => k.trim())
            .filter(Boolean)
            .slice(0, 10),
        }
      }}
    />
  )
}
