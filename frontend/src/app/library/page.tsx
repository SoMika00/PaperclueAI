'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { ProvenanceBadge } from '@/components/Provenance'
import { UploadModal } from '@/components/UploadModal'
import { api } from '@/lib/api'
import type { Manuscript, SavedPaper } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

export default function LibraryPage() {
  const blocked = useRequireAccount()
  const [manuscripts, setManuscripts] = useState<Manuscript[] | null>(null)
  const [saved, setSaved] = useState<SavedPaper[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    if (blocked) return
    Promise.all([
      api<Manuscript[]>('/manuscripts').catch(() => []),
      api<SavedPaper[]>('/library').catch(() => []),
    ])
      .then(([ms, sp]) => {
        setManuscripts(ms)
        setSaved(sp)
      })
      .catch(() =>
        setError('The research backend is unreachable right now — try again in a few minutes.')
      )
  }, [blocked])

  if (blocked) {
    return (
      <AppShell crumb="Library">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb="Library">
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-bold tracking-[-0.3px] text-ink">My Research</div>
            <div className="text-[13px] text-muted">
              Your manuscripts and the papers you&rsquo;ve added from Discover
            </div>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="shrink-0 bg-accent hover:bg-accent-light text-ink text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors"
          >
            Upload manuscript
          </button>
        </div>

        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-3">
          MANUSCRIPTS
        </div>
        {manuscripts === null && !error && (
          <div className="text-[13px] text-muted-light">Loading&hellip;</div>
        )}
        {manuscripts?.length === 0 && (
          <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
            No manuscripts yet — upload one to open its workspace.
          </div>
        )}
        <div className="space-y-3">
          {manuscripts?.map((m) => (
            <Link
              key={m.id}
              href={`/manuscripts/${m.id}`}
              className="block bg-white border border-border rounded-[14px] p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink truncate">{m.title}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {[m.authors?.slice(0, 3).join(', '), m.field_of_study, `${m.n_pages} pages`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <span
                  className="text-[13px] font-bold whitespace-nowrap"
                  style={{ color: m.readiness >= 70 ? '#0f9b8e' : m.readiness >= 40 ? '#e0951a' : '#ff5a7a' }}
                >
                  {m.readiness}%
                </span>
                <span className="text-[11px] text-muted-light">{m.status}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mt-10 mb-3">
          SAVED PAPERS
        </div>
        {saved?.length === 0 && (
          <div className="text-[13px] text-muted-light">
            Nothing saved yet — use &ldquo;Add to my research&rdquo; on any Discover result.
          </div>
        )}
        <div className="space-y-3">
          {saved?.map((p) => (
            <Link
              key={p.id}
              href={`/library/${p.id}`}
              className="block bg-white border border-border rounded-[14px] p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ProvenanceBadge scope={p.source_scope} />
                    <span className="text-xs text-muted">
                      {[p.year, p.venue].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="text-[14px] font-semibold text-ink leading-snug">{p.title}</div>
                  <div className="text-xs text-muted mt-1">
                    {p.authors?.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      </div>
    </AppShell>
  )
}
