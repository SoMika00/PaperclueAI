'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Markdown } from '@/components/Markdown'
import { PromptBar } from '@/components/PromptBar'
import { ProvenanceBadge } from '@/components/Provenance'
import { UploadModal } from '@/components/UploadModal'
import { api, pollTask } from '@/lib/api'
import type { BrowsePaper, Task } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

const SCOPES = [
  { id: 'combined', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'university', label: 'University' },
  { id: 'mine', label: 'My research' },
] as const

type BrowseResult = {
  papers: BrowsePaper[]
  report: string | null
  warnings?: string[]
}

function DiscoverInner() {
  const blocked = useRequireAccount()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefill = searchParams.get('q') ?? ''
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [scope, setScope] = useState<string>('combined')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [creatingMap, setCreatingMap] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const autoRan = useRef(false)

  // "Find related work" from a paper focus lands here with ?q= — run once.
  useEffect(() => {
    if (prefill && !blocked && !autoRan.current) {
      autoRan.current = true
      void handleSubmit(prefill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, blocked])

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

  async function createMapFromSearch() {
    if (!lastQuery || creatingMap) return
    setCreatingMap(true)
    try {
      const { id } = await api<{ id: string }>('/mindmaps', {
        method: 'POST',
        body: JSON.stringify({ seed_type: 'question', question: lastQuery }),
      })
      router.push(`/mind-maps/${id}`)
    } catch (e) {
      setError(`Could not create the map. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
      setCreatingMap(false)
    }
  }

  async function handleSubmit(query: string) {
    setError(null)
    setLoading(true)
    setResult(null)
    setLastQuery(query)
    setSavedIds(new Set())
    setStep('searching')

    try {
      const { task_id } = await api<{ task_id: string }>('/browse', {
        method: 'POST',
        body: JSON.stringify({ query, scope }),
      })
      const task: Task<BrowseResult> = await pollTask(task_id, (t) => {
        setStep(t.step || 'working')
        if (t.result) setResult(t.result)
      })
      if (task.status === 'error') {
        setError(task.error ?? 'Search failed.')
      } else if (task.result) {
        setResult(task.result)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /502|504|Failed to fetch/.test(msg)
          ? 'The research backend is unreachable right now — try again in a few minutes.'
          : `Search failed. ${msg.slice(0, 200)}`
      )
    } finally {
      setLoading(false)
    }
  }

  if (blocked) {
    return (
      <AppShell crumb="Discover">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb="Discover">
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <div className="mb-2 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-bold tracking-[-0.3px] text-ink">Discover</div>
            <div className="text-[13px] text-muted">
              Search the literature or upload your own manuscript to work on
            </div>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="shrink-0 bg-accent hover:bg-accent-light text-ink text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
          >
            Upload manuscript
          </button>
        </div>

        <div className="mt-5">
          <PromptBar
            key={prefill}
            initialValue={prefill}
            placeholder="e.g. What is known about transformer models for clinical risk prediction?"
            onSubmit={handleSubmit}
            disabled={loading}
            accentColor="#3d7dff"
            arrowColor="#ffffff"
            textareaRef={taRef}
          />
        </div>

        {/* Scope pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-[18px]">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              className={`text-[13px] font-medium rounded-full px-4 py-[7px] border transition-colors ${
                scope === s.id
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-ink border-border hover:border-node-blue'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mt-7">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <div className="w-11 h-11 rounded-full bg-node-blue-bg flex items-center justify-center animate-pc-pulse">
              <span className="w-3.5 h-3.5 rounded-[4px] rotate-45" style={{ background: '#3d7dff' }} />
            </div>
            <div className="text-[13px] text-muted capitalize">{step}&hellip;</div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="text-center text-[13px] text-muted-light mt-9">
            Ask a research question — every claim in the synthesis cites a retrieved paper.
          </div>
        )}

        {result && (
          <div className="mt-7 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={createMapFromSearch}
                disabled={creatingMap}
                className="text-[12.5px] font-semibold text-node-violet bg-node-violet-bg hover:opacity-85 disabled:opacity-50 rounded-full px-4 py-2 transition-opacity"
              >
                {creatingMap ? 'Creating map…' : '⤴ Create map from this search'}
              </button>
            </div>
            {result.warnings?.map((w) => (
              <div
                key={w}
                className="text-[12.5px] text-node-amber bg-node-amber-bg rounded-xl px-4 py-2.5"
              >
                {w}
              </div>
            ))}

            {result.report && (
              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                  <span className="w-2.5 h-2.5 rounded-full bg-node-blue shrink-0" />
                  <span className="text-sm font-semibold text-ink">Evidence synthesis</span>
                  <span className="flex-1" />
                  <span className="text-xs text-muted">
                    [n] cites the papers below — nothing else
                  </span>
                </div>
                <div className="px-5 py-4">
                  <Markdown>{result.report}</Markdown>
                </div>
              </div>
            )}

            {result.papers?.length > 0 && (
              <div className="space-y-3">
                {result.papers.map((p) => (
                  <div
                    key={`${p.ref_index}-${p.corpus_id}`}
                    className="bg-white border border-border rounded-[14px] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[13px] font-bold text-muted-light shrink-0 pt-px">
                        [{p.ref_index}]
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-ink leading-snug">
                          {p.url ? (
                            <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                              {p.title}
                            </a>
                          ) : (
                            p.title
                          )}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {[p.authors?.slice(0, 3).join(', '), p.venue, p.year]
                            .filter(Boolean)
                            .join(' · ')}
                          {typeof p.citation_count === 'number' && ` · ${p.citation_count} citations`}
                        </div>
                        {p.rank_explanation && (
                          <div className="text-[12.5px] text-[#3c465c] mt-2 leading-relaxed">
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
          </div>
        )}

        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      </div>
    </AppShell>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverInner />
    </Suspense>
  )
}
