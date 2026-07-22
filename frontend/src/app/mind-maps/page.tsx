'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { api } from '@/lib/api'
import type { Manuscript, MindMapRecord, SavedPaper } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

const SEED_LABEL: Record<string, string> = {
  question: 'from a research question',
  manuscript: 'from a manuscript',
  collection: 'from a collection',
}

type SeedMode = 'question' | 'manuscript' | 'collection'

const SEED_CARDS: { mode: SeedMode; title: string; desc: string; dot: string }[] = [
  { mode: 'question', title: 'From a research question', desc: 'Explore an academic topic from scratch', dot: '#6c4de6' },
  { mode: 'manuscript', title: 'From a manuscript', desc: 'Position your paper inside existing research', dot: '#0f9b8e' },
  { mode: 'collection', title: 'From a collection', desc: 'Organize selected papers into themes', dot: '#3d7dff' },
]

export default function MindMapsPage() {
  const blocked = useRequireAccount()
  const router = useRouter()
  const [maps, setMaps] = useState<MindMapRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<SeedMode>('question')
  const [creating, setCreating] = useState(false)

  // question seed
  const [question, setQuestion] = useState('')
  // manuscript seed
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  // collection seed
  const [saved, setSaved] = useState<SavedPaper[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (blocked) return
    api<MindMapRecord[]>('/mindmaps')
      .then(setMaps)
      .catch(() =>
        setError('The research backend is unreachable right now — try again in a few minutes.')
      )
    api<Manuscript[]>('/manuscripts').then(setManuscripts).catch(() => {})
    api<SavedPaper[]>('/library').then(setSaved).catch(() => {})
  }, [blocked])

  async function create(body: Record<string, unknown>) {
    setCreating(true)
    setError(null)
    try {
      const { id } = await api<{ id: string }>('/mindmaps', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      router.push(`/mind-maps/${id}`)
    } catch (e) {
      setError(`Could not create the map. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
      setCreating(false)
    }
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (blocked) {
    return (
      <AppShell crumb="Mind Maps">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb="Mind Maps">
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <div className="mb-6">
          <div className="text-[22px] font-bold tracking-[-0.3px] text-ink">
            Create a research map
          </div>
          <div className="text-[13px] text-muted">
            Map the literature around a seed, reveal research families and missing references
          </div>
        </div>

        {/* Seed chooser */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {SEED_CARDS.map((c) => (
            <button
              key={c.mode}
              onClick={() => setMode(c.mode)}
              className={`text-left bg-white border rounded-[14px] p-4 transition-colors ${
                mode === c.mode ? 'border-node-violet' : 'border-border hover:border-muted-light'
              }`}
            >
              <span className="w-[9px] h-[9px] rounded-full inline-block mb-2.5" style={{ background: c.dot }} />
              <div className="text-[14px] font-semibold text-ink">{c.title}</div>
              <div className="text-[12px] text-muted mt-0.5 leading-snug">{c.desc}</div>
            </button>
          ))}
        </div>

        {/* Seed input */}
        <div className="bg-ink rounded-2xl p-4 mb-8">
          {mode === 'question' && (
            <>
              <div className="flex items-end gap-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (question.trim()) void create({ seed_type: 'question', question: question.trim() })
                    }
                  }}
                  placeholder="e.g. How do transformer models handle long-context clinical notes?"
                  rows={2}
                  className="flex-1 bg-ink-light rounded-[11px] px-3.5 py-2.5 text-[14px] text-white outline-none resize-none"
                />
                <button
                  onClick={() => question.trim() && create({ seed_type: 'question', question: question.trim() })}
                  disabled={creating || !question.trim()}
                  className="bg-node-violet hover:opacity-90 disabled:opacity-40 text-white text-[13px] font-semibold rounded-[10px] px-4 py-3 whitespace-nowrap transition-opacity"
                >
                  {creating ? 'Creating…' : 'Create map'}
                </button>
              </div>
              <div className="text-[11.5px] text-muted-navy mt-2 pl-0.5">
                Retrieves real papers (public + university), clusters them into research
                families, and explains why each one is on the map.
              </div>
            </>
          )}

          {mode === 'manuscript' && (
            <div>
              <div className="text-[12.5px] text-[#c8d0e0] mb-2.5 pl-0.5">
                Pick a manuscript to position inside existing research:
              </div>
              {manuscripts.length === 0 ? (
                <div className="text-[12.5px] text-muted-navy pl-0.5">
                  No manuscripts yet — upload one first.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                  {manuscripts.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => create({ seed_type: 'manuscript', manuscript_id: m.id })}
                      disabled={creating}
                      className="text-left bg-ink-light hover:bg-[#22355c] disabled:opacity-50 rounded-[10px] px-3.5 py-2.5 text-[13px] text-white transition-colors truncate"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'collection' && (
            <div>
              <div className="text-[12.5px] text-[#c8d0e0] mb-2.5 pl-0.5">
                Select 2+ saved papers to organize into themes:
              </div>
              {saved.length === 0 ? (
                <div className="text-[12.5px] text-muted-navy pl-0.5">
                  Your library is empty — add papers from Discover first.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto mb-3">
                    {saved.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePick(p.id)}
                        className={`text-left rounded-[10px] px-3.5 py-2.5 text-[13px] transition-colors truncate flex items-center gap-2.5 ${
                          picked.has(p.id)
                            ? 'bg-node-violet text-white'
                            : 'bg-ink-light hover:bg-[#22355c] text-white'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                            picked.has(p.id) ? 'bg-white text-node-violet border-white' : 'border-[#3a4a6b]'
                          }`}
                        >
                          {picked.has(p.id) ? '✓' : ''}
                        </span>
                        <span className="truncate">{p.title}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => create({ seed_type: 'collection', paper_ids: [...picked] })}
                    disabled={creating || picked.size < 2}
                    className="bg-node-violet hover:opacity-90 disabled:opacity-40 text-white text-[13px] font-semibold rounded-[10px] px-4 py-2.5 transition-opacity"
                  >
                    {creating ? 'Creating…' : `Create map (${picked.size} selected)`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-3">
          YOUR SAVED MAPS
        </div>
        {maps === null && !error && (
          <div className="text-[13px] text-muted-light">Loading&hellip;</div>
        )}
        {maps?.length === 0 && (
          <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
            No saved maps yet — build one from a seed above, then choose to save it.
          </div>
        )}

        <div className="space-y-3">
          {maps?.map((m) => (
            <Link
              key={m.id}
              href={`/mind-maps/${m.id}`}
              className="flex items-center gap-3 bg-white border border-border rounded-[14px] p-4 hover:border-node-violet transition-colors"
            >
              <span className="w-[9px] h-[9px] rounded-full shrink-0 bg-node-violet" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-ink truncate">{m.title}</div>
                <div className="text-xs text-muted mt-0.5">
                  {SEED_LABEL[m.seed_type] ?? m.seed_type}
                  {typeof m.n_nodes === 'number' && ` · ${m.n_nodes} nodes`}
                </div>
              </div>
              <span className="text-[11px] text-muted-light">{m.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
