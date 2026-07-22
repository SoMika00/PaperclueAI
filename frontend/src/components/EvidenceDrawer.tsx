'use client'

/**
 * Evidence Ledger: every proof the features produce (insight anchors,
 * review issues, citation resolutions, format checks, browse hits),
 * aggregated in a drawer. Clicking a manuscript-anchored proof highlights
 * the PDF.
 */
import { useWorkspace } from '@/lib/workspace'
import type { EvidenceItem } from '@/lib/backend-types'

const KIND_STYLE: Record<string, { color: string; tint: string }> = {
  insight: { color: '#6c4de6', tint: '#ede6ff' },
  review: { color: '#e0951a', tint: '#fff2d6' },
  citation: { color: '#3d7dff', tint: '#e6f0ff' },
  format: { color: '#0f9b8e', tint: '#e0f7f4' },
  browse: { color: '#ff5a7a', tint: '#ffe6ec' },
}

const STATUS_LABEL: Record<string, string> = {
  verified: 'verified',
  unverified: 'unverified',
  conflict: 'conflict',
}

export function EvidenceDrawer() {
  const { evidence, drawerOpen, setDrawerOpen, requestHighlight } = useWorkspace()

  if (!drawerOpen) return null

  function open(e: EvidenceItem) {
    const ref = e.source_ref as { page?: number; quote?: string; url?: string } | null
    if (e.source_type === 'manuscript_span' && ref?.page && ref?.quote) {
      requestHighlight(ref.page, ref.quote, e.kind === 'review' ? 'review' : 'insight')
      setDrawerOpen(false)
    } else if (ref?.url) {
      window.open(ref.url, '_blank', 'noreferrer')
    }
  }

  return (
    <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
      <div className="absolute inset-0 bg-[rgba(20,33,61,0.35)]" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-[-8px_0_32px_rgba(20,33,61,0.15)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <span className="text-[15px] font-bold text-ink flex-1">Evidence ledger</span>
          <span className="text-xs text-muted">{evidence.length} proofs</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-muted hover:text-ink text-[18px] leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {evidence.length === 0 && (
            <p className="text-[13px] text-muted-light text-center py-10 px-6">
              No evidence yet — run Insight, Review, or a related-research search and every
              proof lands here.
            </p>
          )}
          {evidence.map((e) => {
            const style = KIND_STYLE[e.kind] ?? KIND_STYLE.insight
            const ref = e.source_ref as { page?: number; quote?: string } | null
            return (
              <button
                key={e.id}
                onClick={() => open(e)}
                className="w-full text-left px-5 py-3 border-b border-[#f2f2f4] hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5"
                    style={{ color: style.color, background: style.tint }}
                  >
                    {e.kind}
                  </span>
                  <span
                    className={`text-[10.5px] font-medium ${
                      e.status === 'verified'
                        ? 'text-node-teal'
                        : e.status === 'conflict'
                        ? 'text-node-coral'
                        : 'text-muted-light'
                    }`}
                  >
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                  <span className="flex-1" />
                  {typeof e.confidence === 'number' && (
                    <span className="text-[10.5px] text-muted-light">
                      {Math.round(e.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-[#3c465c] leading-snug line-clamp-3">{e.claim}</p>
                {ref?.page && (
                  <span className="text-[11px] text-muted-light">p.{ref.page} ↗</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
