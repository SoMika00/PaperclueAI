'use client'

import { GatedToolPage } from '@/components/GatedToolPage'
import { ScoreBar, scoreColor } from '@/components/ResultParts'
import type { PaperInsightsResponse, ScoreWithJustification } from '@/lib/edge-functions'

const DIMENSION_LABELS: Record<string, string> = {
  novelty: 'Novelty',
  methodology: 'Methodology',
  statistical_soundness: 'Statistical soundness',
  literature_coverage: 'Literature coverage',
  writing_quality: 'Writing quality',
  reproducibility: 'Reproducibility',
  practical_impact: 'Practical impact',
}

function InsightsResult(data: Record<string, unknown>) {
  const res = data as PaperInsightsResponse
  if (!res.scores) return null

  const entries = Object.entries(res.scores).filter(
    (e): e is [string, ScoreWithJustification] => typeof e[1]?.score === 'number'
  )
  if (entries.length === 0) return null

  const avg = entries.reduce((sum, [, v]) => sum + v.score, 0) / entries.length
  const rounded = Math.round(avg * 10) / 10

  return (
    <div>
      <div className="flex items-center gap-3 py-3 border-b border-border">
        <span
          className="text-[26px] font-bold"
          style={{ color: scoreColor(rounded) }}
        >
          {rounded}/10
        </span>
        <span className="text-[13px] text-muted leading-snug">
          overall, averaged across {entries.length} dimensions
        </span>
      </div>
      {res.overall_summary && (
        <p className="text-[13.5px] text-[#3c465c] leading-relaxed py-3 border-b border-border">
          {res.overall_summary}
        </p>
      )}
      {entries.map(([key, value]) => (
        <ScoreBar
          key={key}
          label={DIMENSION_LABELS[key] ?? key.replace(/_/g, ' ')}
          score={value.score}
          justification={value.justification}
        />
      ))}
    </div>
  )
}

export default function PaperInsightsPage() {
  return (
    <GatedToolPage
      toolId="insights"
      edgeFunction="paper-insights"
      requiresDocument
      renderResult={InsightsResult}
      buildBody={(prompt, doc) => ({
        document_text: doc!.text.slice(0, 120000),
        filename: doc!.filename,
      })}
    />
  )
}
