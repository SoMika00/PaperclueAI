'use client'

import { use, useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PaperFocus } from '@/components/PaperFocus'
import { api } from '@/lib/api'
import type { UniversityPaper } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

export default function UniversityPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const blocked = useRequireAccount()
  const [paper, setPaper] = useState<UniversityPaper | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (blocked) return
    api<UniversityPaper>(`/university/${id}`)
      .then(setPaper)
      .catch((e) =>
        setError(/404/.test(String(e)) ? 'Paper not found.' : 'Backend unreachable.')
      )
  }, [blocked, id])

  if (blocked) {
    return (
      <AppShell crumb="University">
        <div className="px-8 py-16 text-center text-sm text-muted">Checking your account&hellip;</div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb={paper?.title ?? 'University'}>
      {error && (
        <div className="max-w-[880px] mx-auto px-8 pt-8">
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3">
            {error}
          </div>
        </div>
      )}
      {!paper && !error && (
        <div className="px-8 py-16 text-center text-[13px] text-muted-light">Loading&hellip;</div>
      )}
      {paper && (
        <PaperFocus
          focusId={paper.id}
          focusKind="university"
          paper={{
            corpus_id: paper.s2_id ?? paper.id,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            venue: paper.venue,
            abstract: paper.abstract,
            doi: paper.doi,
            source_scope: 'university',
            collection: paper.collection,
          }}
          saved={false}
        />
      )}
    </AppShell>
  )
}
