'use client'

import { useRef, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PromptBar, PromptExampleChip } from '@/components/PromptBar'
import { ContinueWorking } from '@/components/ContinueWorking'
import { LockedToolCard } from '@/components/LockedToolCard'
import { MindMapCanvas } from '@/components/MindMapCanvas'
import { ToolIcon } from '@/components/ToolIcon'
import { useAuth } from '@/lib/auth-context'
import { generateMindMap } from '@/lib/edge-functions'
import { keywordsToMindMap, parseKeywordsResponse, type MindMap } from '@/lib/mindmap'
import type { ParsedDocument } from '@/lib/parse-file'
import { splitIntoSections } from '@/lib/sections'
import { TOOLS, toolById } from '@/lib/tools'

const mindMap = toolById('mindmap')

function HeroNetwork() {
  return (
    <svg width="320" height="230" viewBox="0 0 320 230">
      <line x1="160" y1="112" x2="72" y2="42" stroke="#33456b" strokeWidth="1.5" />
      <line x1="160" y1="112" x2="262" y2="52" stroke="#33456b" strokeWidth="1.5" />
      <line x1="160" y1="112" x2="96" y2="186" stroke="#33456b" strokeWidth="1.5" />
      <line x1="160" y1="112" x2="238" y2="172" stroke="#33456b" strokeWidth="1.5" />
      <line x1="160" y1="112" x2="288" y2="122" stroke="#33456b" strokeWidth="1.5" />
      <line x1="72" y1="42" x2="34" y2="88" stroke="#33456b" strokeWidth="1.2" />
      <line x1="262" y1="52" x2="206" y2="22" stroke="#33456b" strokeWidth="1.2" />
      <line x1="96" y1="186" x2="150" y2="214" stroke="#33456b" strokeWidth="1.2" />
      <circle cx="160" cy="112" r="15" fill="#ff8a3d" />
      <circle cx="72" cy="42" r="8" fill="#6c4de6" />
      <circle cx="262" cy="52" r="8" fill="#ff5a7a" />
      <circle cx="96" cy="186" r="9" fill="#0f9b8e" />
      <circle cx="238" cy="172" r="7" fill="#e0951a" />
      <circle cx="288" cy="122" r="6" fill="#3d7dff" />
      <circle cx="34" cy="88" r="4.5" fill="#5b6b8c" />
      <circle cx="206" cy="22" r="4.5" fill="#5b6b8c" />
      <circle cx="150" cy="214" r="4.5" fill="#5b6b8c" />
    </svg>
  )
}

type MindMapResult = { prompt: string; map: MindMap | null }

export default function HomePage() {
  const { isGuest, loading: authLoading } = useAuth()
  const guest = authLoading || isGuest
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [prefill, setPrefill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MindMapResult | null>(null)

  async function handleSubmit(prompt: string, doc: ParsedDocument | null) {
    setError(null)
    setLoading(true)
    setResult(null)

    // Topic-seeded mind map. When a paper is attached, anchor the topic to its
    // title so the map's research directions match the paper. (Document
    // analysis / review lives in the dedicated tools, not here.)
    let topic = prompt
    if (doc) {
      const sections = splitIntoSections(doc.text, doc.filename)
      topic = `${prompt} (paper: ${sections.title})`.slice(0, 250)
    }

    try {
      const response = await generateMindMap(topic)
      const keywords = parseKeywordsResponse(response)
      const map = keywordsToMindMap(prompt, keywords)
      if (!map) {
        setError('The backend returned no keywords for this topic. Try rephrasing it.')
        return
      }
      setResult({ prompt, map })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      if (message === 'RATE_LIMITED') {
        setError("You're sending requests too fast. Wait a moment and try again.")
      } else if (message === 'NO_SESSION') {
        setError(
          'The demo backend needs a session for every AI call — create a free account to run your first mind map.'
        )
      } else if (message.startsWith('EDGE_FUNCTION_ERROR')) {
        setError(`Could not generate the mind map. Backend said: ${message}`)
      } else {
        setError('Could not generate the mind map. Try again in a moment.')
      }
    } finally {
      setLoading(false)
    }
  }

  function fillChip(text: string) {
    setPrefill(text)
    requestAnimationFrame(() => taRef.current?.focus())
  }

  // Follow-up: drill into one of the generated research directions by
  // regenerating the map focused on it.
  function exploreDirection(label: string) {
    setPrefill(label)
    void handleSubmit(label, null)
  }

  return (
    <AppShell>
      <div className="max-w-[880px] mx-auto px-8 pt-7 pb-16">
        {/* Hero */}
        <div className="bg-ink rounded-[18px] px-11 py-10 flex items-center gap-9 overflow-hidden">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-[7px] bg-ink-light rounded-full px-3 py-[5px] mb-[18px]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-xs font-medium text-[#c8d0e0] whitespace-nowrap">
                {guest ? 'Free to try — no account needed' : 'All tools unlocked'}
              </span>
            </div>
            <h1 className="text-[32px] font-bold leading-[1.2] text-white tracking-[-0.5px] text-balance">
              Every topic is a{' '}
              <span className="font-serif italic font-semibold text-accent">network</span>, not a
              wall of text
            </h1>
            <p className="text-[15px] text-hero-sub leading-relaxed mt-3.5 mb-[22px] max-w-[420px]">
              Enter a research topic and watch it unfold into a map of directions, themes, and
              gaps. To analyze or review your own paper, head to Discover or the tools below.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => taRef.current?.focus()}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-ink text-sm font-semibold rounded-[10px] px-5 py-[11px] whitespace-nowrap transition-colors"
              >
                Start a mind map
              </button>
            </div>
          </div>
          <div className="shrink-0 w-[320px] hidden lg:block">
            <HeroNetwork />
          </div>
        </div>

        {/* Prompt bar */}
        <div className="mt-6">
          <PromptBar
            key={prefill}
            initialValue={prefill}
            placeholder={mindMap.placeholder}
            onSubmit={handleSubmit}
            disabled={loading}
            textareaRef={taRef}
          />
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2.5 justify-center mt-[18px]">
          {mindMap.chips.map((chip) => (
            <PromptExampleChip key={chip} color={mindMap.color} onClick={() => fillChip(chip)}>
              {chip}
            </PromptExampleChip>
          ))}
        </div>

        {/* Response area */}
        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mt-7">
            {error}
          </div>
        )}

        {!error && !loading && !result && (
          <div className="text-center text-[13px] text-muted-light mt-9">
            Your mind map will appear here once you send a prompt.
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <div className="w-11 h-11 rounded-full bg-node-violet-bg flex items-center justify-center animate-pc-pulse">
              <ToolIcon id="mindmap" color="#6c4de6" size={18} />
            </div>
            <div className="text-[13px] text-muted">Working on it&hellip;</div>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white border border-border rounded-2xl mt-7 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <span className="w-7 h-7 rounded-full bg-node-violet-bg flex items-center justify-center shrink-0">
                <ToolIcon id="mindmap" color="#6c4de6" size={13} />
              </span>
              <span className="text-sm font-semibold text-ink truncate">
                Mind map — {result.map!.title}
              </span>
              <span className="flex-1" />
              <span className="text-xs text-muted whitespace-nowrap">
                {result.map!.nodes.length - 1} research directions
              </span>
            </div>
            <MindMapCanvas map={result.map!} />
          </div>
        )}

        {/* Follow-up suggestions: the generated research directions as chips —
            click to drill into a focused sub-map, or open one to find papers. */}
        {result && !loading && result.map && result.map.nodes.length > 1 && (
          <div className="mt-5">
            <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-2.5">
              EXPLORE THESE DIRECTIONS
            </div>
            <div className="flex flex-wrap gap-2.5">
              {result.map.nodes
                .filter((n) => n.group !== 0)
                .slice(0, 8)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => exploreDirection(n.label)}
                    className="inline-flex items-center gap-2 bg-white border border-border hover:border-node-violet rounded-full px-4 py-[9px] text-[13px] font-medium text-ink transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path d="M6 0l1.5 4.5L12 6 7.5 7.5 6 12 4.5 7.5 0 6l4.5-1.5z" fill="#6c4de6" />
                    </svg>
                    {n.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {!guest && <ContinueWorking />}

        {/* Tool cards */}
        <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light text-center mt-14 mb-5">
          {guest ? 'UNLOCK WITH AN ACCOUNT' : 'MORE TOOLS'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
          {TOOLS.filter((t) => !t.free).map((tool) => (
            <LockedToolCard key={tool.id} tool={tool} guest={guest} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
