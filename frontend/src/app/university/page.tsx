'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { ProvenanceBadge } from '@/components/Provenance'
import { api } from '@/lib/api'
import type { UniversityPaper } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

export default function UniversityPage() {
  const blocked = useRequireAccount()
  const [papers, setPapers] = useState<UniversityPaper[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function load(q?: string) {
    api<UniversityPaper[]>(`/university${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(setPapers)
      .catch(() =>
        setError('The research backend is unreachable right now — try again in a few minutes.')
      )
      .finally(() => setSearching(false))
  }

  useEffect(() => {
    if (blocked) return
    load()
  }, [blocked])

  function onSearch(v: string) {
    setQuery(v)
    if (debounce.current) clearTimeout(debounce.current)
    setSearching(true)
    debounce.current = setTimeout(() => load(v.trim() || undefined), 400)
  }

  // Group papers by lab/collection, preserving order.
  const grouped = useMemo(() => {
    const groups: Record<string, UniversityPaper[]> = {}
    for (const p of papers ?? []) {
      const key = p.collection || 'Repository'
      ;(groups[key] = groups[key] ?? []).push(p)
    }
    return Object.entries(groups)
  }, [papers])

  if (blocked) {
    return (
      <AppShell crumb="University">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb="University">
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <div className="mb-5">
          <div className="text-[22px] font-bold tracking-[-0.3px] text-ink">
            University repository
          </div>
          <div className="text-[13px] text-muted">
            Institutional papers, private to your tenant — searchable here and in Discover,
            never sent to public engines
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search title, abstract or topic (semantic)…"
          className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-ink bg-white outline-none focus:border-accent transition-colors mb-6"
        />

        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {(papers === null || searching) && !error && (
          <div className="text-[13px] text-muted-light">
            {searching ? 'Searching…' : 'Loading…'}
          </div>
        )}
        {papers?.length === 0 && !searching && (
          <div className="text-[13px] text-muted-light">No papers match that search.</div>
        )}

        {grouped.map(([lab, items]) => (
          <div key={lab} className="mb-8">
            <div className="text-[11px] font-semibold tracking-[1.4px] text-muted-light mb-3">
              {lab.toUpperCase()}
            </div>
            <div className="space-y-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/university/${p.id}`}
                  className="block bg-white border border-border rounded-[14px] p-4 hover:border-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ProvenanceBadge scope="university" />
                        <span className="text-xs text-muted">
                          {[p.year, p.venue].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <div className="text-[14px] font-semibold text-ink leading-snug">
                        {p.title}
                      </div>
                      {p.authors?.length > 0 && (
                        <div className="text-xs text-muted mt-1">
                          {p.authors.slice(0, 4).join(', ')}
                        </div>
                      )}
                      {p.abstract && (
                        <p className="text-[12.5px] text-[#3c465c] mt-2 leading-relaxed line-clamp-2">
                          {p.abstract}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
