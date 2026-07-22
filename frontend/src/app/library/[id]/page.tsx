'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { PaperFocus } from '@/components/PaperFocus'
import { api } from '@/lib/api'
import type { SavedPaper } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

export default function LibraryPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const blocked = useRequireAccount()
  const [paper, setPaper] = useState<SavedPaper | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (blocked) return
    api<SavedPaper>(`/library/${id}`)
      .then(setPaper)
      .catch((e) =>
        setError(/404/.test(String(e)) ? 'Paper not found in your library.' : 'Backend unreachable.')
      )
  }, [blocked, id])

  async function remove() {
    try {
      await api(`/library/${id}`, { method: 'DELETE' })
      router.push('/library')
    } catch {
      setError('Could not remove this paper.')
    }
  }

  if (blocked) {
    return (
      <AppShell crumb="Library">
        <div className="px-8 py-16 text-center text-sm text-muted">Checking your account&hellip;</div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb={paper?.title ?? 'Library'}>
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
          focusKind="library"
          paper={{
            corpus_id: paper.corpus_id,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            venue: paper.venue,
            abstract: paper.abstract,
            url: paper.url,
            source_scope: paper.source_scope,
            tldr: paper.tldr,
            citation_count: paper.citation_count,
            open_access_pdf_url: paper.open_access_pdf_url,
          }}
          saved
          onRemove={remove}
        />
      )}
    </AppShell>
  )
}
