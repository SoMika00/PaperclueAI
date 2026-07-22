'use client'

import { useEffect, useState } from 'react'
import { SplitView } from '@/components/SplitView'
import { api, downloadBlob, pollTask } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace'

const TEAL = '#0f9b8e'

type Journal = { id: string; name: string; article_type: string; rules: string[] }
type Check = { rule: string; status: 'pass' | 'fail' | 'warning'; detail: string }
type FormatResult = {
  journal: string
  journal_id: string
  checklist: Check[]
  rewrite: {
    abstract_before?: string
    abstract_after?: string
    restructure_plan?: { from: string; to: string; note: string }[]
    added_statements?: string[]
  }
}

const CHECK_STYLE: Record<string, { icon: string; color: string }> = {
  pass: { icon: '✓', color: '#0f9b8e' },
  warning: { icon: '⚠', color: '#e0951a' },
  fail: { icon: '✗', color: '#ff5a7a' },
}

export default function JournalPage() {
  const { ms, refreshEvidence } = useWorkspace()
  const [journals, setJournals] = useState<Journal[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FormatResult | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api<Journal[]>('/journals')
      .then((js) => {
        setJournals(js)
        if (js.length && !selected) setSelected(js[0].id)
      })
      .catch(() => setError('Could not load journal profiles from the backend.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runFormat() {
    if (!ms || !selected) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const { task_id } = await api<{ task_id: string }>(
        `/format/${ms.id}?journal=${encodeURIComponent(selected)}`,
        { method: 'POST' }
      )
      const task = await pollTask<FormatResult>(task_id, (t) => setStep(t.step || ''))
      if (task.status === 'error') {
        setError(task.error ?? 'Formatting check failed.')
      } else if (task.result) {
        setResult(task.result)
        void refreshEvidence()
      }
    } catch (e) {
      setError(`Formatting check failed. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
    } finally {
      setRunning(false)
    }
  }

  async function exportDocx() {
    if (!ms || !selected) return
    setExporting(true)
    try {
      await downloadBlob(
        `/format/${ms.id}/export?journal=${encodeURIComponent(selected)}`,
        `${ms.title.slice(0, 40).replace(/\s+/g, '_')}_${selected}.docx`
      )
    } catch (e) {
      setError(`Export failed. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
    } finally {
      setExporting(false)
    }
  }

  const passCount = result?.checklist.filter((c) => c.status === 'pass').length ?? 0

  return (
    <SplitView>
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Journal picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {journals.map((j) => (
          <button
            key={j.id}
            onClick={() => setSelected(j.id)}
            className={`text-left bg-white border rounded-[14px] p-4 transition-colors ${
              selected === j.id ? 'border-node-teal' : 'border-border hover:border-muted-light'
            }`}
          >
            <div className="text-[14px] font-semibold text-ink">{j.name}</div>
            <div className="text-xs text-muted mt-0.5">{j.article_type}</div>
            <div className="text-[11.5px] text-muted-light mt-1.5">{j.rules.length} submission rules</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 mb-5">
        <button
          onClick={runFormat}
          disabled={running || !selected}
          className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
        >
          {running ? 'Checking…' : 'Check compliance'}
        </button>
        <button
          onClick={exportDocx}
          disabled={exporting || !selected}
          className="bg-white border border-border hover:border-ink text-ink text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
        >
          {exporting ? 'Exporting…' : 'Export DOCX'}
        </button>
      </div>

      {running && (
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 mb-5">
          <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          <span className="text-[13px] text-muted">{step || 'Working…'}</span>
        </div>
      )}

      {result && (
        <>
          {/* Checklist */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TEAL }} />
              <span className="text-sm font-semibold text-ink">
                {result.journal} — {passCount}/{result.checklist.length} rules pass
              </span>
            </div>
            <div>
              {result.checklist.map((c, i) => {
                const st = CHECK_STYLE[c.status] ?? CHECK_STYLE.warning
                return (
                  <div key={i} className="px-5 py-3 border-b border-[#f2f2f4] last:border-0 flex items-start gap-3">
                    <span className="font-bold shrink-0" style={{ color: st.color }}>
                      {st.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink">{c.rule}</div>
                      <div className="text-[12.5px] text-muted mt-0.5">{c.detail}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Abstract before/after */}
          {result.rewrite?.abstract_after && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-border text-sm font-semibold text-ink">
                Abstract — before / after
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 border-b md:border-b-0 md:border-r border-[#f2f2f4]">
                  <div className="text-[10.5px] font-semibold tracking-[1px] text-muted-light mb-2">
                    CURRENT
                  </div>
                  <p className="text-[12.5px] text-[#3c465c] leading-relaxed">
                    {result.rewrite.abstract_before}
                  </p>
                </div>
                <div className="p-4 bg-node-teal-bg/30">
                  <div className="text-[10.5px] font-semibold tracking-[1px] mb-2" style={{ color: TEAL }}>
                    COMPLIANT REWRITE
                  </div>
                  <p className="text-[12.5px] text-[#3c465c] leading-relaxed">
                    {result.rewrite.abstract_after}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Restructure plan */}
          {result.rewrite?.restructure_plan && result.rewrite.restructure_plan.length > 0 && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-border text-sm font-semibold text-ink">
                Restructure plan
              </div>
              <div>
                {result.rewrite.restructure_plan.map((r, i) => (
                  <div key={i} className="px-5 py-3 border-b border-[#f2f2f4] last:border-0">
                    <div className="text-[13px] text-ink font-medium">
                      {r.from} <span className="text-muted-light">→</span> {r.to}
                    </div>
                    {r.note && <div className="text-[12.5px] text-muted mt-0.5">{r.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added statements */}
          {result.rewrite?.added_statements && result.rewrite.added_statements.length > 0 && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border text-sm font-semibold text-ink">
                Statements to add
              </div>
              <div className="px-5 py-3 space-y-2">
                {result.rewrite.added_statements.map((s, i) => (
                  <p key={i} className="text-[12.5px] text-[#3c465c] leading-relaxed bg-background border border-border rounded-[10px] p-3">
                    {s}
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !running && (
        <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
          Pick a target journal and run the compliance check — you get a rule-by-rule
          checklist, a compliant abstract rewrite, and a restructure plan.
        </div>
      )}
    </SplitView>
  )
}
