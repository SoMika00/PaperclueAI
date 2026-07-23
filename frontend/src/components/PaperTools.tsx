'use client'

/**
 * The seven paper-intelligence tools for any *suggested* paper — mind-map
 * nodes and Focus cards alike (see the two reference screenshots). A suggested
 * paper is not an ingested manuscript, so these run server-side on its
 * metadata / open-access PDF via /api/papers/{corpus_id}/*. Results are
 * fetched on demand, cached per tool in local state, and the backend also
 * caches them, so re-opening a tool is instant.
 *
 * Two of the tools (Figures, Tables) need an open-access PDF and degrade
 * honestly to a "not available" message; the four text tools work from the
 * abstract and get richer when the paper has been opened in Focus.
 */
import { useState } from 'react'
import { api } from '@/lib/api'
import type {
  JournalRanking,
  PaperFiguresResult,
  PaperTablesResult,
  PaperTextResult,
  PaperToolKind,
} from '@/lib/backend-types'

type AnyResult = PaperTextResult | PaperFiguresResult | PaperTablesResult | JournalRanking

const TOOLS: { kind: PaperToolKind; label: string; method: 'GET' | 'POST' }[] = [
  { kind: 'summary', label: 'Summarize', method: 'POST' },
  { kind: 'key_concepts', label: 'Key concepts', method: 'POST' },
  { kind: 'explanation', label: 'Explanation', method: 'POST' },
  { kind: 'research_gap', label: 'Research gap', method: 'POST' },
  { kind: 'figures', label: 'Extract figures', method: 'POST' },
  { kind: 'tables', label: 'Extract tables', method: 'POST' },
  { kind: 'journal_ranking', label: 'Journal ranking', method: 'GET' },
]

const PATH: Record<PaperToolKind, string> = {
  summary: 'analyze',
  key_concepts: 'analyze',
  explanation: 'analyze',
  research_gap: 'analyze',
  figures: 'figures',
  tables: 'tables',
  journal_ranking: 'journal-ranking',
}

export function PaperTools({
  corpusId,
  compact = false,
}: {
  corpusId: string
  /** compact = embedded in the narrow mind-map node panel */
  compact?: boolean
}) {
  const [active, setActive] = useState<PaperToolKind | null>(null)
  const [loading, setLoading] = useState<PaperToolKind | null>(null)
  const [cache, setCache] = useState<Partial<Record<PaperToolKind, AnyResult>>>({})
  const [error, setError] = useState<string | null>(null)

  async function run(kind: PaperToolKind) {
    if (active === kind) {
      setActive(null)
      return
    }
    setActive(kind)
    setError(null)
    if (cache[kind]) return // already fetched this session
    setLoading(kind)
    try {
      const suffix = PATH[kind]
      const isAnalyze = suffix === 'analyze'
      const res = await api<AnyResult>(`/papers/${encodeURIComponent(corpusId)}/${suffix}`, {
        method: TOOLS.find((t) => t.kind === kind)!.method,
        body: isAnalyze ? JSON.stringify({ kind }) : undefined,
      })
      setCache((prev) => ({ ...prev, [kind]: res }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // Surface the backend's own friendly message (404/422 carry it).
      const m = msg.match(/\d{3}:\s*(.*)$/)
      let detail = m ? m[1] : msg
      try {
        const parsed = JSON.parse(detail)
        detail = parsed.detail || detail
      } catch {
        /* not JSON */
      }
      setError(detail?.slice(0, 240) || 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => {
          const isActive = active === t.kind
          return (
            <button
              key={t.kind}
              onClick={() => run(t.kind)}
              disabled={loading !== null}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50',
                compact ? 'text-[11.5px] px-2.5 py-1.5' : 'text-[12.5px] px-3 py-2',
                isActive
                  ? 'bg-accent text-ink'
                  : 'bg-white border border-border text-ink hover:border-accent',
              ].join(' ')}
            >
              {loading === t.kind ? 'Working…' : t.label}
            </button>
          )
        })}
      </div>

      {active && (
        <div
          className={[
            'mt-3 border border-border rounded-xl bg-white',
            compact ? 'p-3 max-h-[320px] overflow-y-auto' : 'p-4',
          ].join(' ')}
        >
          {loading === active ? (
            <p className="text-[12.5px] text-muted">Analyzing…</p>
          ) : error ? (
            <p className="text-[12.5px] text-node-coral">{error}</p>
          ) : cache[active] ? (
            <ResultView kind={active} data={cache[active]!} />
          ) : (
            <p className="text-[12.5px] text-muted">No result.</p>
          )}
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold tracking-[1px] text-muted-light mb-2 uppercase">
      {children}
    </div>
  )
}

function ResultView({ kind, data }: { kind: PaperToolKind; data: AnyResult }) {
  if (kind === 'summary' || kind === 'explanation') {
    const text = (data as PaperTextResult).result?.text || ''
    const depth = (data as PaperTextResult).depth
    return (
      <div>
        <Label>{kind === 'summary' ? 'Summary' : 'Explanation'}</Label>
        {text.split(/\n\n+/).map((p, i) => (
          <p key={i} className="text-[13px] text-[#3c465c] leading-relaxed mb-2 last:mb-0">
            {p}
          </p>
        ))}
        <DepthNote depth={depth} />
      </div>
    )
  }

  if (kind === 'key_concepts') {
    const concepts = (data as PaperTextResult).result?.concepts || []
    return (
      <div>
        <Label>Key concepts</Label>
        <ul className="space-y-2">
          {concepts.map((c, i) => (
            <li key={i} className="text-[13px] leading-relaxed">
              <span className="font-semibold text-ink">{c.term}</span>
              <span className="text-[#3c465c]"> — {c.definition}</span>
            </li>
          ))}
        </ul>
        <DepthNote depth={(data as PaperTextResult).depth} />
      </div>
    )
  }

  if (kind === 'research_gap') {
    const gaps = (data as PaperTextResult).result?.gaps || []
    return (
      <div>
        <Label>Research gaps</Label>
        <ul className="space-y-2.5">
          {gaps.map((g, i) => (
            <li key={i} className="text-[13px] leading-relaxed">
              <span className="font-semibold text-ink">{g.gap}</span>
              <p className="text-[#3c465c] mt-0.5">{g.detail}</p>
            </li>
          ))}
        </ul>
        <DepthNote depth={(data as PaperTextResult).depth} />
      </div>
    )
  }

  if (kind === 'figures') {
    const d = data as PaperFiguresResult
    if (!d.figures.length) return <p className="text-[12.5px] text-muted">{d.note}</p>
    return (
      <div>
        <Label>{d.figures.length} figure{d.figures.length > 1 ? 's' : ''} extracted</Label>
        <div className="grid grid-cols-2 gap-3">
          {d.figures.map((f, i) => (
            <figure key={i} className="border border-border rounded-lg overflow-hidden bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.image} alt={`Figure from page ${f.page}`} className="w-full h-auto block" />
              <figcaption className="text-[10.5px] text-muted-light px-2 py-1">
                page {f.page} · {f.width}×{f.height}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    )
  }

  if (kind === 'tables') {
    const d = data as PaperTablesResult
    if (!d.tables.length) return <p className="text-[12.5px] text-muted">{d.note}</p>
    return (
      <div className="space-y-4">
        <Label>{d.tables.length} table{d.tables.length > 1 ? 's' : ''} extracted</Label>
        {d.tables.map((t, i) => (
          <div key={i}>
            <div className="text-[11px] text-muted-light mb-1">page {t.page}</div>
            {t.image ? (
              // A rendered crop reads correctly even when the cell parser can't
              // untangle a complex multi-column table.
              <div className="border border-border rounded-lg overflow-x-auto bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt={`Table from page ${t.page}`} className="max-w-full h-auto block" />
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="text-[11.5px] border-collapse w-full">
                  <tbody>
                    {t.rows.map((row, r) => (
                      <tr key={r} className={r === 0 ? 'bg-background font-semibold' : ''}>
                        {row.map((cell, c) => (
                          <td key={c} className="border border-border px-2 py-1 align-top whitespace-pre-wrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // journal_ranking
  const d = data as JournalRanking
  return (
    <div>
      <Label>Journal / impact ranking</Label>
      {d.venue && <div className="text-[13.5px] font-semibold text-ink">{d.venue}</div>}
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <span className="inline-flex items-center rounded-full bg-accent/20 text-ink text-[12px] font-semibold px-2.5 py-1">
          {d.impact_tier}
        </span>
        <span className="text-[12px] text-muted">{d.impact_blurb}</span>
      </div>
      <div className="text-[12.5px] text-[#3c465c] mt-2">
        {d.metrics.citation_count.toLocaleString()} citations ·{' '}
        {d.metrics.influential_citation_count.toLocaleString()} influential
        {d.fields_of_study.length > 0 && <> · {d.fields_of_study.join(', ')}</>}
      </div>
      <p className="text-[11px] text-muted-light mt-2.5 leading-snug italic">{d.disclaimer}</p>
    </div>
  )
}

function DepthNote({ depth }: { depth: 'abstract' | 'full_text' }) {
  return (
    <p className="text-[10.5px] text-muted-light mt-2.5">
      {depth === 'full_text'
        ? 'Based on the full text (this paper is open in Focus).'
        : 'Based on the abstract. Open the paper in Focus for a full-text analysis.'}
    </p>
  )
}
