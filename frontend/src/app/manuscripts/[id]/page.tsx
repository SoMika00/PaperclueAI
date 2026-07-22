'use client'

import Link from 'next/link'
import { ScoreBar } from '@/components/ResultParts'
import { useWorkspace } from '@/lib/workspace'

/**
 * Overview tab: readiness breakdown + pipeline state + "where you stand"
 * navigation cards. Readiness recipe (verified against the live backend):
 * base 15 (ingestion) + insight 15 + citations 30×(verified/total) + review
 * 40−open-issue-penalties. readiness_detail carries both the four score
 * fields (base/insight/citations/review) and status booleans/counts
 * (insight_done, citations_checked, review_done, open_issues,
 * refs_verified, refs_total) — only the score fields render as bars.
 */

const SCORE_FIELDS: Record<string, { label: string; max: number }> = {
  base: { label: 'Ingestion', max: 15 },
  insight: { label: 'Paper insight', max: 15 },
  citations: { label: 'Citations verified', max: 30 },
  review: { label: 'Review issues resolved', max: 40 },
}

export default function ManuscriptOverviewPage() {
  const { ms, error } = useWorkspace()

  const readinessColor =
    ms && ms.readiness >= 70 ? '#0f9b8e' : ms && ms.readiness >= 40 ? '#e0951a' : '#ff5a7a'

  const detail = ms?.readiness_detail ?? {}
  const scoreEntries = Object.entries(SCORE_FIELDS).filter(([key]) => key in detail)
  const openIssues = typeof detail.open_issues === 'number' ? detail.open_issues : null
  const refsTotal = typeof detail.refs_total === 'number' ? detail.refs_total : 0
  const refsVerified = typeof detail.refs_verified === 'number' ? detail.refs_verified : 0

  return (
    <div className="max-w-[880px] mx-auto px-8 pt-8 pb-16">
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!ms && !error && <div className="text-[13px] text-muted-light">Loading&hellip;</div>}

      {ms && (
        <>
          <div className="flex items-start gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <div className="text-[22px] font-bold tracking-[-0.3px] text-ink leading-snug">
                Submission readiness
              </div>
              <div className="text-[13px] text-muted mt-1">
                How the score is built — each component is inspectable. These are automated
                indicators of submission preparation, not a judgment of the work&rsquo;s
                scientific quality.
              </div>
              {ms.index_status && ms.index_status !== 'ready' && (
                <div className="inline-flex items-center gap-1.5 text-[11.5px] text-node-amber bg-node-amber-bg rounded-full px-2.5 py-1 mt-2">
                  semantic index: {ms.index_status} — chat falls back to lexical search until
                  it&rsquo;s ready
                </div>
              )}
            </div>
            <div className="text-center shrink-0">
              <div
                className="text-[34px] font-bold leading-none"
                style={{ color: readinessColor }}
              >
                {ms.readiness}
              </div>
              <div className="text-[10.5px] text-muted-light font-semibold tracking-wide mt-1">
                READINESS
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-2">
              {scoreEntries.map(([key, meta]) => {
                const value = detail[key] as number
                const outOf10 = Math.min(10, Math.round((value / meta.max) * 100) / 10)
                return (
                  <ScoreBar
                    key={key}
                    label={meta.label}
                    score={outOf10}
                    justification={`${Math.round(value)} of ${meta.max} points`}
                  />
                )
              })}
              {scoreEntries.length === 0 && (
                <div className="text-[13px] text-muted-light py-3">
                  Breakdown appears once ingestion completes.
                </div>
              )}
            </div>
          </div>

          {/* Where you stand */}
          <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-3">
            WHERE YOU STAND
          </div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
            <Link
              href={`/manuscripts/${ms.id}/insight`}
              className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-background transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-ink">Paper Insight</div>
                <div className="text-xs text-muted mt-0.5">
                  {ms.has_insight ? 'Complete — anchored brief ready' : 'Not started yet'}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-accent whitespace-nowrap">Open →</span>
            </Link>
            <Link
              href={`/manuscripts/${ms.id}/review`}
              className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-background transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-ink">Review</div>
                <div className="text-xs text-muted mt-0.5">
                  {openIssues === null ? 'Not run yet' : `${openIssues} open issues`}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-accent whitespace-nowrap">Open →</span>
            </Link>
            <Link
              href={`/manuscripts/${ms.id}/review`}
              className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-background transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-ink">Citations</div>
                <div className="text-xs text-muted mt-0.5">
                  {refsTotal > 0
                    ? `${refsVerified}/${refsTotal} verified against the public corpus`
                    : 'No references extracted yet'}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-accent whitespace-nowrap">Open →</span>
            </Link>
            <Link
              href={`/manuscripts/${ms.id}/related-research`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-background transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-ink">Related Research</div>
                <div className="text-xs text-muted mt-0.5">
                  Search literature connected to this manuscript
                </div>
              </div>
              <span className="text-[13px] font-semibold text-accent whitespace-nowrap">Open →</span>
            </Link>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border text-sm font-semibold text-ink">
              Pipeline
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {Object.entries(ms.ingest_steps ?? {}).map(([step, status]) => (
                <span
                  key={step}
                  className={`text-[12px] font-medium rounded-full px-3 py-1 ${
                    status === 'done'
                      ? 'bg-node-teal-bg text-node-teal'
                      : status === 'running'
                      ? 'bg-node-amber-bg text-node-amber'
                      : 'bg-background text-muted border border-border'
                  }`}
                >
                  {step.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
