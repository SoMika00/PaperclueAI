'use client'

import { useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { SplitView } from '@/components/SplitView'
import { api, sseStream } from '@/lib/api'
import type { AnchoredClaim, InsightBrief } from '@/lib/backend-types'
import { useWorkspace } from '@/lib/workspace'

const VIOLET = '#6c4de6'

function ClaimRow({
  label,
  item,
  onLocate,
}: {
  label: string
  item: AnchoredClaim
  onLocate: (item: AnchoredClaim) => void
}) {
  if (!item?.claim) return null
  return (
    <div className="flex gap-3.5 py-3 border-b border-[#f2f2f4] last:border-0">
      <span className="shrink-0 w-[92px] text-xs font-semibold pt-px uppercase" style={{ color: VIOLET }}>
        {label}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] text-[#3c465c] leading-relaxed">{item.claim}</p>
        <button
          onClick={() => onLocate(item)}
          className="text-[12px] text-muted hover:text-accent mt-1 text-left transition-colors"
          title="Scroll the PDF to this quote"
        >
          &ldquo;{item.quote}&rdquo; — {item.section}, p.{item.page} ↗
        </button>
      </div>
    </div>
  )
}

type ChatMsg = { role: 'user' | 'assistant'; content: string }
type ChatSource = { page: number; section: string; quote: string; score: number }

export default function InsightPage() {
  const { ms, refresh, requestHighlight, refreshEvidence } = useWorkspace()
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [sources, setSources] = useState<ChatSource[]>([])
  const [question, setQuestion] = useState('')
  const [streaming, setStreaming] = useState(false)
  const streamBuf = useRef('')

  const brief = (ms?.insight ?? null) as InsightBrief | null

  async function buildBrief() {
    if (!ms) return
    setBuilding(true)
    setError(null)
    try {
      await api(`/insight/${ms.id}`, { method: 'POST' })
      await refresh()
      void refreshEvidence()
    } catch (e) {
      setError(
        `Could not build the brief. ${e instanceof Error ? e.message.slice(0, 200) : ''}`
      )
    } finally {
      setBuilding(false)
    }
  }

  function locate(item: AnchoredClaim, kind: 'insight' | 'review' = 'insight') {
    requestHighlight(item.page, item.quote, kind)
  }

  async function ask() {
    if (!ms || !question.trim() || streaming) return
    const q = question.trim()
    setQuestion('')
    setError(null)
    setSources([])
    const history = messages.slice(-6)
    setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    setStreaming(true)
    streamBuf.current = ''

    await sseStream(
      `/insight/${ms.id}/chat`,
      { question: q, history },
      {
        onSources: (s) => setSources(s as ChatSource[]),
        onDelta: (delta) => {
          streamBuf.current += delta
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: streamBuf.current }
            return next
          })
        },
        onError: (e) => {
          setError(`Chat failed: ${String(e).slice(0, 200)}`)
          setStreaming(false)
        },
        onDone: () => setStreaming(false),
      }
    )
  }

  return (
    <SplitView>
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Brief */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: VIOLET }} />
          <span className="text-sm font-semibold text-ink">Paper insight</span>
          <span className="flex-1" />
          {brief && <span className="text-xs text-muted">click a quote → the PDF locates it</span>}
        </div>
        <div className="px-5 py-2">
          {!brief && (
            <div className="py-6 text-center">
              <p className="text-[13px] text-muted mb-4">
                A structured brief of this paper — problem, contribution, method, results,
                limitations — with every claim anchored to an exact quote.
              </p>
              <button
                onClick={buildBrief}
                disabled={building}
                className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-sm font-semibold rounded-[9px] px-5 py-2.5 transition-colors"
              >
                {building ? 'Reading the manuscript…' : 'Build the brief'}
              </button>
            </div>
          )}
          {brief && (
            <>
              <ClaimRow label="Problem" item={brief.problem} onLocate={locate} />
              <ClaimRow label="Contribution" item={brief.contribution} onLocate={locate} />
              <ClaimRow label="Method" item={brief.method} onLocate={locate} />
              {brief.key_results?.map((r, i) => (
                <ClaimRow key={i} label={`Result ${i + 1}`} item={r} onLocate={locate} />
              ))}
              {brief.limitations?.map((l, i) => (
                <ClaimRow key={i} label="Limitation" item={l} onLocate={locate} />
              ))}
              {brief.gap_hints && brief.gap_hints.length > 0 && (
                <div className="flex gap-3.5 py-3">
                  <span className="shrink-0 w-[92px] text-xs font-semibold pt-px uppercase text-node-amber">
                    Gap hints
                  </span>
                  <ul className="space-y-1.5">
                    {brief.gap_hints.map((g, i) => (
                      <li key={i} className="text-[13px] text-[#3c465c] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-node-amber mt-[7px] shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
          <span className="w-2.5 h-2.5 rounded-full bg-node-blue shrink-0" />
          <span className="text-sm font-semibold text-ink">Chat with your paper</span>
          <span className="flex-1" />
          <span className="text-xs text-muted">answers cite pages — (p.X)</span>
        </div>

        <div className="px-5 py-3 max-h-[420px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-[13px] text-muted-light py-3 text-center">
              Ask anything — answers come only from this manuscript&rsquo;s text.
            </p>
          )}
          <div className="space-y-3">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-ink text-white text-[13px] rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="text-[13.5px]">
                  {m.content ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    <span className="text-muted-light text-[13px]">Reading the paper&hellip;</span>
                  )}
                </div>
              )
            )}
          </div>
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sources.map((s, i) => (
                <button
                  key={i}
                  onClick={() => requestHighlight(s.page, s.quote, 'insight')}
                  className="text-[11px] font-medium text-node-blue bg-node-blue-bg rounded-full px-2.5 py-1 hover:opacity-80 transition-opacity"
                  title={s.quote}
                >
                  p.{s.page} · {s.section || 'source'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void ask()
              }
            }}
            placeholder="e.g. What is the main contribution?"
            rows={1}
            className="flex-1 bg-background border border-border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent resize-none transition-colors"
          />
          <button
            onClick={() => void ask()}
            disabled={streaming || !question.trim()}
            className="bg-node-blue hover:opacity-90 disabled:opacity-40 text-white text-[13px] font-semibold rounded-[10px] px-4 py-2.5 transition-opacity"
          >
            {streaming ? '…' : 'Ask'}
          </button>
        </div>
      </div>
    </SplitView>
  )
}
