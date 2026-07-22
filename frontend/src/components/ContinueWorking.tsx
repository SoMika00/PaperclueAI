'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Manuscript } from '@/lib/backend-types'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function statusPills(m: Manuscript): { label: string; tone: 'done' | 'pending' | 'warn' }[] {
  const pills: { label: string; tone: 'done' | 'pending' | 'warn' }[] = []
  if (m.has_insight) pills.push({ label: 'Insight ✓', tone: 'done' })
  const detail = m.readiness_detail ?? {}
  const openIssues = typeof detail.open_issues === 'number' ? detail.open_issues : null
  if (openIssues !== null) {
    pills.push(
      openIssues === 0
        ? { label: 'Review complete', tone: 'done' }
        : { label: `Review: ${openIssues} open`, tone: 'warn' }
    )
  } else {
    pills.push({ label: 'Review pending', tone: 'pending' })
  }
  const total = typeof detail.refs_total === 'number' ? detail.refs_total : null
  const verified = typeof detail.refs_verified === 'number' ? detail.refs_verified : 0
  if (total !== null) {
    pills.push({
      label: `${verified}/${total} references verified`,
      tone: verified === total && total > 0 ? 'done' : 'warn',
    })
  }
  return pills
}

const PILL_TONE = {
  done: 'text-node-teal bg-node-teal-bg',
  pending: 'text-muted bg-background border border-border',
  warn: 'text-node-amber bg-node-amber-bg',
} as const

export function ContinueWorking() {
  const [manuscripts, setManuscripts] = useState<Manuscript[] | null>(null)

  useEffect(() => {
    api<Manuscript[]>('/manuscripts')
      .then((list) => setManuscripts(list.slice(0, 3)))
      .catch(() => setManuscripts([]))
  }, [])

  if (!manuscripts || manuscripts.length === 0) return null

  return (
    <div className="mt-10">
      <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-3">
        CONTINUE WORKING
      </div>
      <div className="space-y-3">
        {manuscripts.map((m) => (
          <Link
            key={m.id}
            href={`/manuscripts/${m.id}`}
            className="block bg-white border border-border rounded-2xl p-5 hover:border-accent transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold text-ink leading-snug">{m.title}</div>
                <div className="text-xs text-muted mt-1">
                  {[m.field_of_study, `${m.n_pages} pages`, `last activity ${timeAgo(m.updated_at)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-node-teal bg-node-teal-bg rounded-full px-2.5 py-1 whitespace-nowrap">
                Private
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] text-muted whitespace-nowrap">Submission readiness</span>
              <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, m.readiness)}%` }}
                />
              </div>
              <span className="text-[13px] font-semibold text-ink whitespace-nowrap">
                {m.readiness}/100
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusPills(m).map((p, i) => (
                <span
                  key={i}
                  className={`text-[11.5px] font-medium rounded-full px-2.5 py-1 ${PILL_TONE[p.tone]}`}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
