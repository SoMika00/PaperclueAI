'use client'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { callEdgeFunction } from '@/lib/edge-functions'

/**
 * Temporary API-discovery page for the redeployed `mind-map` edge
 * function (its contract no longer matches the backend PDF). Visit
 * /debug/mind-map while logged in, run the probes, and share the output.
 * Delete this page once the contract is confirmed.
 */

const PROBES: Array<{ label: string; body: Record<string, unknown> }> = [
  { label: 'invalid mode (hoping it lists valid modes)', body: { mode: '__probe__', topic: 'x' } },
  { label: 'keywords mode with topic', body: { topic: 'machine learning for diabetes prediction' } },
  {
    label: 'from-text mode',
    body: {
      mode: 'from-text',
      text: 'Deep learning models can predict diabetes onset from routine bloodwork. We evaluate five architectures on a cohort of 12,000 patients.',
    },
  },
  {
    label: 'text mode',
    body: {
      mode: 'text',
      text: 'Deep learning models can predict diabetes onset from routine bloodwork.',
    },
  },
  { label: 'prompt only (old ai-proxy shape)', body: { prompt: 'map arguments about diabetes prediction' } },
]

type ProbeResult = { label: string; body: string; result: string }

export default function MindMapDebugPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ProbeResult[]>([])
  const [copied, setCopied] = useState(false)

  async function runProbes() {
    setRunning(true)
    setResults([])
    for (const probe of PROBES) {
      let outcome: string
      try {
        const res = await callEdgeFunction('mind-map', probe.body)
        outcome = 'OK: ' + JSON.stringify(res).slice(0, 900)
      } catch (err) {
        outcome = 'ERR: ' + (err instanceof Error ? err.message : String(err))
      }
      setResults((prev) => [
        ...prev,
        { label: probe.label, body: JSON.stringify(probe.body), result: outcome },
      ])
      // Stay friendly with the per-user rate limit.
      await new Promise((r) => setTimeout(r, 1500))
    }
    setRunning(false)
  }

  async function copyAll() {
    const text = results.map((r) => `### ${r.label}\nbody: ${r.body}\n${r.result}`).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <AppShell crumb="Debug — mind-map API">
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <h1 className="text-[22px] font-bold tracking-[-0.3px] text-ink mb-1">
          mind-map function probe
        </h1>
        <p className="text-[13px] text-muted mb-5">
          Runs {PROBES.length} candidate payloads against the deployed function using your
          session. Copy the results and share them.
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={runProbes}
            disabled={running}
            className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-sm font-semibold rounded-[9px] px-5 py-2.5 transition-colors"
          >
            {running ? `Probing… (${results.length}/${PROBES.length})` : 'Run probes'}
          </button>
          {results.length > 0 && !running && (
            <button
              onClick={copyAll}
              className="bg-accent hover:bg-accent-light text-ink text-sm font-semibold rounded-[9px] px-5 py-2.5 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy results'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {results.map((r, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4">
              <div className="text-[13px] font-semibold text-ink mb-1">{r.label}</div>
              <div className="text-xs text-muted mb-2 font-mono">{r.body}</div>
              <pre className="text-xs text-[#3c465c] whitespace-pre-wrap break-all bg-background border border-border rounded-lg p-3">
                {r.result}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
