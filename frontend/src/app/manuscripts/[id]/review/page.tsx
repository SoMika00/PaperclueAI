'use client'

import { useEffect, useState } from 'react'
import { SplitView } from '@/components/SplitView'
import { api, pollTask } from '@/lib/api'
import type { Issue, Reference } from '@/lib/backend-types'
import { useWorkspace } from '@/lib/workspace'

const SEVERITY: Record<string, { color: string; tint: string }> = {
  critical: { color: '#ff5a7a', tint: '#ffe6ec' },
  major: { color: '#e0951a', tint: '#fff2d6' },
  minor: { color: '#3d7dff', tint: '#e6f0ff' },
}

const REF_STATUS: Record<string, { icon: string; color: string; label: string }> = {
  verified: { icon: '✓', color: '#0f9b8e', label: 'verified' },
  suspect: { icon: '⚠', color: '#e0951a', label: 'metadata mismatch' },
  not_found: { icon: '✗', color: '#ff5a7a', label: 'not found' },
  unverified: { icon: '·', color: '#b0b0b8', label: 'not checked yet' },
}

function IssueCard({
  issue,
  onAction,
  onLocate,
}: {
  issue: Issue
  onAction: (id: string, action: 'accept' | 'reject', edit?: string) => Promise<void>
  onLocate: (issue: Issue) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState(issue.suggestion)
  const [busy, setBusy] = useState(false)
  const sev = SEVERITY[issue.severity] ?? SEVERITY.minor
  const closed = issue.status !== 'open'

  async function act(action: 'accept' | 'reject') {
    setBusy(true)
    try {
      await onAction(issue.id, action, editing && edit !== issue.suggestion ? edit : undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`bg-white border border-border rounded-[14px] overflow-hidden ${
        closed ? 'opacity-60' : ''
      }`}
    >
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left px-4 py-3 flex items-center gap-3">
        <span
          className="text-[10.5px] font-bold uppercase rounded-full px-2 py-0.5 shrink-0"
          style={{ color: sev.color, background: sev.tint }}
        >
          {issue.severity}
        </span>
        <span className="text-[13.5px] font-semibold text-ink flex-1 min-w-0 truncate">
          {issue.title}
        </span>
        <span className="text-[11px] text-muted-light shrink-0">
          {closed ? issue.status : issue.category}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#f2f2f4] pt-3">
          <p className="text-[13px] text-[#3c465c] leading-relaxed mb-2">{issue.description}</p>
          {issue.quote && (
            <button
              onClick={() => onLocate(issue)}
              className="text-[12px] text-muted hover:text-accent text-left mb-2 transition-colors"
              title="Scroll the PDF to this passage"
            >
              &ldquo;{issue.quote}&rdquo;
              {issue.page ? ` — p.${issue.page}` : ''} ↗
            </button>
          )}
          {issue.evidence_note && (
            <p className="text-[11.5px] text-muted-light mb-2">{issue.evidence_note}</p>
          )}

          <div className="bg-background border border-border rounded-[10px] p-3 mb-3">
            <div className="text-[10.5px] font-semibold tracking-[1px] text-muted-light mb-1.5">
              SUGGESTION
            </div>
            {editing ? (
              <textarea
                value={edit}
                onChange={(e) => setEdit(e.target.value)}
                rows={3}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent resize-none"
              />
            ) : (
              <p className="text-[13px] text-[#3c465c] leading-relaxed">{issue.suggestion}</p>
            )}
          </div>

          {!closed && (
            <div className="flex gap-2">
              <button
                onClick={() => act('accept')}
                disabled={busy}
                className="bg-node-teal hover:opacity-90 disabled:opacity-50 text-white text-[12.5px] font-semibold rounded-lg px-4 py-2 transition-opacity"
              >
                Accept fix
              </button>
              <button
                onClick={() => setEditing((v) => !v)}
                disabled={busy}
                className="bg-white border border-border hover:border-ink text-ink text-[12.5px] font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {editing ? 'Keep original' : 'Edit'}
              </button>
              <button
                onClick={() => act('reject')}
                disabled={busy}
                className="text-muted hover:text-node-coral text-[12.5px] font-semibold px-3 py-2 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReviewPage() {
  const { ms, refresh, requestHighlight, refreshEvidence } = useWorkspace()
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [references, setReferences] = useState<Reference[] | null>(null)
  const [running, setRunning] = useState<'review' | 'verify' | null>(null)
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showRefs, setShowRefs] = useState(false)

  useEffect(() => {
    if (!ms) return
    api<Issue[]>(`/manuscripts/${ms.id}/issues`).then(setIssues).catch(() => setIssues([]))
    api<Reference[]>(`/manuscripts/${ms.id}/references`)
      .then(setReferences)
      .catch(() => setReferences([]))
  }, [ms])

  async function runReview() {
    if (!ms) return
    setRunning('review')
    setError(null)
    try {
      const { task_id } = await api<{ task_id: string }>(`/review/${ms.id}`, { method: 'POST' })
      const task = await pollTask<{ issues: Issue[] }>(task_id, (t) => setStep(t.step || ''))
      if (task.status === 'error') {
        setError(task.error ?? 'Review failed.')
      } else if (task.result) {
        setIssues(task.result.issues)
        await refresh()
        void refreshEvidence()
      }
    } catch (e) {
      setError(`Review failed. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
    } finally {
      setRunning(null)
    }
  }

  async function runVerify() {
    if (!ms) return
    setRunning('verify')
    setError(null)
    try {
      const { task_id } = await api<{ task_id: string }>(`/verify/${ms.id}`, { method: 'POST' })
      const task = await pollTask<{ references: Reference[] }>(task_id, (t) => setStep(t.step || ''))
      if (task.status === 'error') {
        setError(task.error ?? 'Verification failed.')
      } else if (task.result) {
        setReferences(task.result.references)
        setShowRefs(true)
        await refresh()
      }
    } catch (e) {
      setError(`Verification failed. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
    } finally {
      setRunning(null)
    }
  }

  async function actOnIssue(id: string, action: 'accept' | 'reject', edit?: string) {
    try {
      await api(`/review-issues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...(edit ? { edit } : {}) }),
      })
      if (ms) {
        const fresh = await api<Issue[]>(`/manuscripts/${ms.id}/issues`)
        setIssues(fresh)
        await refresh()
      }
    } catch (e) {
      setError(`Action failed. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
    }
  }

  const open = issues?.filter((i) => i.status === 'open') ?? []
  const closed = issues?.filter((i) => i.status !== 'open') ?? []
  const verifiedCount = references?.filter((r) => r.status === 'verified').length ?? 0

  return (
    <SplitView>
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5 mb-5">
        <button
          onClick={runReview}
          disabled={running !== null}
          className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
        >
          {running === 'review' ? 'Reviewing…' : issues?.length ? 'Re-run review' : 'Run peer review'}
        </button>
        <button
          onClick={runVerify}
          disabled={running !== null}
          className="bg-white border border-border hover:border-ink text-ink text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
        >
          {running === 'verify' ? 'Verifying…' : 'Verify citations'}
        </button>
      </div>

      {running && (
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 mb-5">
          <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          <span className="text-[13px] text-muted">{step || 'Working…'}</span>
        </div>
      )}

      {/* References summary */}
      {references && references.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
          <button
            onClick={() => setShowRefs((v) => !v)}
            className="w-full flex items-center gap-2.5 px-5 py-3.5 text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-node-blue shrink-0" />
            <span className="text-sm font-semibold text-ink">
              References — {verifiedCount}/{references.length} verified
            </span>
            <span className="flex-1" />
            <span className="text-xs text-muted">{showRefs ? 'hide' : 'show'}</span>
          </button>
          {showRefs && (
            <div className="border-t border-border max-h-[300px] overflow-y-auto">
              {references.map((r) => {
                const st = REF_STATUS[r.status] ?? REF_STATUS.unverified
                return (
                  <div key={r.id} className="px-5 py-2.5 border-b border-[#f2f2f4] last:border-0 flex items-start gap-2.5">
                    <span className="font-bold shrink-0" style={{ color: st.color }}>
                      {st.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-ink leading-snug">
                        {r.resolved_meta?.url ? (
                          <a href={r.resolved_meta.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                            {r.title || r.raw.slice(0, 120)}
                          </a>
                        ) : (
                          r.title || r.raw.slice(0, 120)
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: st.color }}>
                        {st.label}
                        {r.status === 'suspect' && r.resolved_meta?.title
                          ? ` — closest real paper: ${r.resolved_meta.title.slice(0, 80)} (${r.resolved_meta.year ?? '?'})`
                          : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Issues */}
      {issues === null && <div className="text-[13px] text-muted-light">Loading&hellip;</div>}
      {issues?.length === 0 && !running && (
        <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
          No review yet. Run the peer review to get anchored, severity-graded issues with
          concrete fixes — accepting a fix records a version and moves the readiness score.
        </div>
      )}

      <div className="space-y-3">
        {open.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onAction={actOnIssue}
            onLocate={(i) => requestHighlight(i.page, i.quote, 'review')}
          />
        ))}
      </div>

      {closed.length > 0 && (
        <>
          <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mt-6 mb-3">
            RESOLVED ({closed.length})
          </div>
          <div className="space-y-3">
            {closed.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onAction={actOnIssue}
                onLocate={(i) => requestHighlight(i.page, i.quote, 'review')}
              />
            ))}
          </div>
        </>
      )}
    </SplitView>
  )
}
