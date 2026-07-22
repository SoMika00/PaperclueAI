'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProvenanceBadge } from '@/components/Provenance'
import { PaperTools } from '@/components/PaperTools'
import { api } from '@/lib/api'
import type { SourceScope } from '@/lib/backend-types'

/**
 * Shared paper focus/detail view (Library + University). Mirrors Michail's
 * "focus" screen: badges, TL;DR, abstract, and the ever-present bridge
 * actions — including "Open in Focus", which imports the paper's
 * open-access PDF and opens the full manuscript workspace on it (same
 * ingestion pipeline as a manual upload).
 */

export type FocusPaper = {
  corpus_id: string
  title: string
  authors: string[]
  year: number | null
  venue: string
  abstract: string
  url?: string | null
  doi?: string | null
  source_scope: SourceScope
  tldr?: string | null
  citation_count?: number | null
  open_access_pdf_url?: string | null
  collection?: string
}

function ActionButton({
  children,
  onClick,
  href,
  variant = 'secondary',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) {
  const cls =
    variant === 'primary'
      ? 'bg-accent hover:bg-accent-light text-ink'
      : variant === 'danger'
      ? 'bg-white border border-border hover:border-node-coral text-muted hover:text-node-coral'
      : 'bg-white border border-border hover:border-ink text-ink'
  const common =
    'inline-flex items-center gap-2 text-[13px] font-semibold rounded-[9px] px-4 py-2.5 transition-colors disabled:opacity-50 whitespace-nowrap'
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${common} ${cls}`}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${common} ${cls}`}>
      {children}
    </button>
  )
}

export function PaperFocus({
  paper,
  focusId,
  focusKind,
  saved,
  onRemove,
}: {
  paper: FocusPaper
  /** The row's own id (SavedPaper.id or UniversityPaper.id) — what /import expects, distinct from corpus_id. */
  focusId: string
  focusKind: 'library' | 'university'
  /** true = already in library (show Remove); false = show Add to my research */
  saved: boolean
  onRemove?: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [inLibrary, setInLibrary] = useState(saved)
  const [error, setError] = useState<string | null>(null)

  async function openInFocus() {
    setBusy('focus')
    setError(null)
    try {
      const { manuscript_id } = await api<{ manuscript_id: string; already: boolean }>('/import', {
        method: 'POST',
        body: JSON.stringify({ kind: focusKind, id: focusId }),
      })
      router.push(`/manuscripts/${manuscript_id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(
        /open-access/i.test(msg)
          ? 'No open-access full text is available for this paper — Focus needs the PDF. You can still read the abstract here, or use "Find related work" instead.'
          : `Could not open Focus. ${msg.slice(0, 160)}`
      )
      setBusy(null)
    }
  }

  async function mapAround() {
    setBusy('map')
    setError(null)
    try {
      const { id } = await api<{ id: string }>('/mindmaps', {
        method: 'POST',
        body: JSON.stringify({ seed_type: 'question', question: paper.title }),
      })
      router.push(`/mind-maps/${id}`)
    } catch (e) {
      setError(`Could not build the map. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
      setBusy(null)
    }
  }

  function findRelated() {
    router.push(`/discover?q=${encodeURIComponent(paper.title)}`)
  }

  async function addToLibrary() {
    setBusy('add')
    setError(null)
    try {
      await api('/library', {
        method: 'POST',
        body: JSON.stringify({
          corpus_id: paper.corpus_id,
          title: paper.title,
          authors: paper.authors ?? [],
          year: paper.year,
          venue: paper.venue ?? '',
          abstract: paper.abstract ?? '',
          url: paper.url,
          source_scope: paper.source_scope,
        }),
      })
      setInLibrary(true)
    } catch (e) {
      setError(`Could not save. ${e instanceof Error ? e.message.slice(0, 160) : ''}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-[880px] mx-auto px-8 pt-8 pb-16">
      <div className="flex items-center gap-3 mb-3">
        <ProvenanceBadge scope={paper.source_scope} />
        <span className="text-xs text-muted">
          {[paper.year, paper.venue].filter(Boolean).join(' · ')}
          {typeof paper.citation_count === 'number' && ` · ${paper.citation_count} citations`}
        </span>
      </div>

      <h1 className="text-[24px] font-bold tracking-[-0.3px] text-ink leading-snug">
        {paper.title}
      </h1>
      {paper.authors?.length > 0 && (
        <p className="text-[14px] text-muted mt-2">{paper.authors.join(', ')}</p>
      )}

      {/* Row 1: primary actions */}
      <div className="flex flex-wrap gap-2.5 mt-5">
        <ActionButton variant="primary" onClick={openInFocus} disabled={busy !== null}>
          {busy === 'focus' ? 'Fetching full text…' : 'Open in Focus'}
        </ActionButton>
        {inLibrary && onRemove ? (
          <ActionButton
            variant="danger"
            onClick={() => {
              setBusy('remove')
              onRemove()
            }}
            disabled={busy !== null}
          >
            Remove
          </ActionButton>
        ) : !inLibrary ? (
          <ActionButton onClick={addToLibrary} disabled={busy !== null}>
            {busy === 'add' ? 'Adding…' : '+ Add to my research'}
          </ActionButton>
        ) : (
          <span className="inline-flex items-center text-[13px] font-semibold text-node-teal px-2 py-2.5">
            ✓ In your library
          </span>
        )}
        <ActionButton onClick={findRelated}>Find related work</ActionButton>
      </div>

      {/* Row 2: mapping + external links */}
      <div className="flex flex-wrap gap-2.5 mt-2.5">
        <ActionButton onClick={mapAround} disabled={busy !== null}>
          {busy === 'map' ? 'Building map…' : 'Map the literature around it'}
        </ActionButton>
        {paper.open_access_pdf_url && (
          <ActionButton href={paper.open_access_pdf_url}>Open-access PDF</ActionButton>
        )}
        {paper.url && <ActionButton href={paper.url}>Open on Semantic Scholar</ActionButton>}
        {paper.doi && (
          <ActionButton href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}>
            DOI
          </ActionButton>
        )}
      </div>

      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mt-5">
          {error}
        </div>
      )}

      {/* Paper intelligence: summarize, key concepts, explanation, research
          gap, extract figures/tables, journal ranking — on the paper itself. */}
      <div className="mt-6">
        <div className="text-[10.5px] font-semibold tracking-[1px] text-muted-light mb-2.5">
          PAPER TOOLS
        </div>
        <PaperTools corpusId={paper.corpus_id} />
      </div>

      {paper.tldr && (
        <div className="bg-white border border-border rounded-2xl p-5 mt-6">
          <div className="text-[10.5px] font-semibold tracking-[1px] text-node-blue mb-2">
            TL;DR (SEMANTIC SCHOLAR)
          </div>
          <p className="text-[13.5px] text-[#3c465c] leading-relaxed">{paper.tldr}</p>
        </div>
      )}

      {paper.abstract && (
        <div className="mt-6">
          <div className="text-[10.5px] font-semibold tracking-[1px] text-muted-light mb-2">
            ABSTRACT
          </div>
          <p className="text-[13.5px] text-[#3c465c] leading-relaxed">{paper.abstract}</p>
        </div>
      )}
    </div>
  )
}
