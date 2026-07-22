'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { EvidenceDrawer } from '@/components/EvidenceDrawer'
import { ReadinessGauge } from '@/components/ReadinessGauge'
import { api, pollTask } from '@/lib/api'
import type { Version } from '@/lib/backend-types'
import { useI18n, type TKey } from '@/lib/i18n'
import { useRequireAccount } from '@/lib/use-account'
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace'

const TABS: { seg: string; labelKey: TKey }[] = [
  { seg: '', labelKey: 'tab_overview' },
  { seg: 'insight', labelKey: 'tab_insight' },
  { seg: 'related-research', labelKey: 'tab_related' },
  { seg: 'mind-map', labelKey: 'tab_mindmap' },
  { seg: 'review', labelKey: 'tab_review' },
  { seg: 'journal', labelKey: 'tab_journal' },
  { seg: 'versions', labelKey: 'tab_versions' },
]

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function TitleBar({ id }: { id: string }) {
  const router = useRouter()
  const { ms, refresh, evidence, setDrawerOpen } = useWorkspace()
  const [versionCount, setVersionCount] = useState<number | null>(null)
  const [runningReview, setRunningReview] = useState(false)

  useEffect(() => {
    api<Version[]>(`/manuscripts/${id}/versions`)
      .then((v) => setVersionCount(v.length || 1))
      .catch(() => setVersionCount(1))
  }, [id])

  async function runReview() {
    setRunningReview(true)
    try {
      const { task_id } = await api<{ task_id: string }>(`/review/${id}`, { method: 'POST' })
      await pollTask(task_id)
      await refresh()
      router.push(`/manuscripts/${id}/review`)
    } catch {
      router.push(`/manuscripts/${id}/review`)
    } finally {
      setRunningReview(false)
    }
  }

  if (!ms) return null

  const statusLine = [
    'Private manuscript',
    versionCount ? `Version ${versionCount}` : null,
    `Saved ${timeAgo(ms.updated_at)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="border-b border-border bg-white">
      <div className="max-w-[1360px] mx-auto px-8 py-3.5 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink truncate">{ms.title}</div>
          <div className="text-xs text-muted mt-0.5">
            {statusLine}
            {ms.has_insight && ' | Insight complete'}
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-[12.5px] font-medium text-muted hover:text-ink whitespace-nowrap transition-colors"
        >
          Evidence {evidence.length}
        </button>
        <Link
          href={`/manuscripts/${id}/journal`}
          className="text-[13px] font-semibold text-ink hover:text-accent whitespace-nowrap transition-colors"
        >
          Export
        </Link>
        <button
          onClick={runReview}
          disabled={runningReview}
          className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-[13px] font-semibold rounded-[9px] px-4 py-2 whitespace-nowrap transition-colors"
        >
          {runningReview ? 'Running…' : 'Run review'}
        </button>
        <ReadinessGauge value={ms.readiness} />
      </div>
    </div>
  )
}

function WorkspaceChrome({ id, children }: { id: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const { ms } = useWorkspace()
  const { t } = useI18n()
  const base = `/manuscripts/${id}`

  return (
    <AppShell crumb={ms?.title ?? 'Manuscript'}>
      <TitleBar id={id} />
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1360px] mx-auto px-8 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const href = tab.seg ? `${base}/${tab.seg}` : base
            const active = pathname === href
            return (
              <Link
                key={tab.seg}
                href={href}
                className={`relative px-3.5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {t(tab.labelKey)}
                <span
                  className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-[2px] bg-accent"
                  style={{ opacity: active ? 1 : 0 }}
                />
              </Link>
            )
          })}
        </div>
      </div>
      {children}
      <EvidenceDrawer />
    </AppShell>
  )
}

export default function ManuscriptLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = use(params)
  const blocked = useRequireAccount()

  if (blocked) {
    return (
      <AppShell crumb="Manuscript">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <WorkspaceProvider id={id}>
      <WorkspaceChrome id={id}>{children}</WorkspaceChrome>
    </WorkspaceProvider>
  )
}
