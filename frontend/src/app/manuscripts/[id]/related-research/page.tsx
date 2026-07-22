'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Markdown } from '@/components/Markdown'
import { ProvenanceBadge } from '@/components/Provenance'
import { SplitView } from '@/components/SplitView'
import { api, pollTask } from '@/lib/api'
import type { BrowsePaper } from '@/lib/backend-types'
import { useWorkspace } from '@/lib/workspace'

type BrowseResult = { papers: BrowsePaper[]; report: string | null; warnings?: string[] }

function RelatedResearchInner() {
  const { ms, refreshEvidence } = useWorkspace()
  const searchParams = useSearchParams()
  const prefill = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(prefill)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const autoRan = useRef(false)

  async function search(q: string) {
    if (!ms || !q.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { task_id } = await api<{ task_id: string }>('/browse', {
        method: 'POST',
        body: JSON.stringify({ query: q, scope: 'combined', manuscript_id: ms.id }),
      })
      const task = await pollTask<BrowseResult>(task_id, (t) => {
        setStep(t.step || 'working')
        if (t.result) setResult(t.result)
      })
      if (task.status === 'error') setError(task.error ?? 'Search failed.')
      else if (task.result) {
        setResult(task.result)
        void refreshEvidence()
      }
    } catch (e) {
      setError(`Search failed. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
    } finally {
      setLoading(false)
    }
  }

  // "Find sources" from the PDF lands here with ?q= — run it once automatically.
  useEffect(() => {
    if (prefill && ms && !autoRan.current) {
      autoRan.current = true
      void search(prefill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, ms])

  async function addToLibrary(p: BrowsePaper) {
    try {
      await api('/library', {
        method: 'POST',
        body: JSON.stringify({
          corpus_id: p.corpus_id,
          title: p.title,
          authors: p.authors ?? [],
          year: p.year,
          venue: p.venue ?? '',
          abstract: p.abstract ?? '',
          url: p.url,
          source_scope: p.source_scope,
        }),
      })
      setSavedIds((prev) => new Set(prev).add(p.corpus_id))
    } catch (e) {
      setError(`Could not save. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
    }
  }

  return (
    <SplitView>
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-end gap-2 mb-5">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void search(query)
            }
          }}
          placeholder="Search literature related to this manuscript…"
          rows={1}
          className="flex-1 bg-white border border-border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent resize-none transition-colors"
        />
        <button
          onClick={() => void search(query)}
          disabled={loading || !query.trim()}
          className="bg-node-blue hover:opacity-90 disabled:opacity-40 text-white text-[13px] font-semibold rounded-[10px] px-4 py-2.5 transition-opacity"
        >
          Search
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 mb-5">
          <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          <span className="text-[13px] text-muted capitalize">{step || 'Searching…'}</span>
        </div>
      )}

      {!result && !loading && (
        <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
          Search here, or select text in the PDF and hit &ldquo;Find sources&rdquo; — results
          land in this tab and the top 5 are recorded as evidence.
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.warnings?.map((w) => (
            <div key={w} className="text-[12.5px] text-node-amber bg-node-amber-bg rounded-xl px-4 py-2.5">
              {w}
            </div>
          ))}

          {result.report && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-semibold text-ink">
                Evidence synthesis
              </div>
              <div className="px-5 py-4">
                <Markdown>{result.report}</Markdown>
              </div>
            </div>
          )}

          {result.papers?.map((p) => (
            <div key={`${p.ref_index}-${p.corpus_id}`} className="bg-white border border-border rounded-[14px] p-4">
              <div className="flex items-start gap-3">
                <span className="text-[13px] font-bold text-muted-light shrink-0 pt-px">
                  [{p.ref_index}]
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-ink leading-snug">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {[p.authors?.slice(0, 3).join(', '), p.venue, p.year].filter(Boolean).join(' · ')}
                  </div>
                  {p.rank_explanation && (
                    <div className="text-[12px] text-[#3c465c] mt-1.5 leading-relaxed">
                      {p.rank_explanation}
                    </div>
                  )}
                  <button
                    onClick={() => addToLibrary(p)}
                    disabled={savedIds.has(p.corpus_id)}
                    className="text-[12px] font-semibold text-node-teal hover:opacity-80 disabled:text-muted-light mt-2 transition-opacity"
                  >
                    {savedIds.has(p.corpus_id) ? '✓ In your library' : '+ Add to my research'}
                  </button>
                </div>
                <ProvenanceBadge scope={p.source_scope} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SplitView>
  )
}

export default function RelatedResearchPage() {
  return (
    <Suspense>
      <RelatedResearchInner />
    </Suspense>
  )
}
