'use client'

/**
 * Manuscript workspace context: one manuscript fetch shared by the layout
 * and every feature tab, plus the cross-feature state — PDF highlight
 * requests (feature → PDF direction) and the evidence ledger.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { EvidenceItem, Manuscript } from '@/lib/backend-types'

export type HighlightReq = {
  page: number
  quote: string
  kind: 'insight' | 'review' | 'citation'
  nonce: number
}

type WorkspaceState = {
  ms: Manuscript | null
  error: string | null
  refresh: () => Promise<void>
  highlight: HighlightReq | null
  requestHighlight: (page: number | null | undefined, quote: string, kind: HighlightReq['kind']) => void
  evidence: EvidenceItem[]
  refreshEvidence: () => Promise<void>
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined)

export function WorkspaceProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [ms, setMs] = useState<Manuscript | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<HighlightReq | null>(null)
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const refresh = useCallback(
    () =>
      api<Manuscript>(`/manuscripts/${id}`)
        .then((m) => {
          setMs(m)
          setError(null)
        })
        .catch((e) => {
          setError(
            /404/.test(String(e))
              ? 'Manuscript not found.'
              : 'The research backend is unreachable right now — try again in a few minutes.'
          )
        }),
    [id]
  )

  const refreshEvidence = useCallback(
    () =>
      api<EvidenceItem[]>(`/manuscripts/${id}/evidence`)
        .then(setEvidence)
        .catch(() => {}),
    [id]
  )

  useEffect(() => {
    void refresh()
    void refreshEvidence()
  }, [refresh, refreshEvidence])

  const requestHighlight = useCallback(
    (page: number | null | undefined, quote: string, kind: HighlightReq['kind']) => {
      if (!page || !quote) return
      setHighlight({ page, quote, kind, nonce: Date.now() })
    },
    []
  )

  return (
    <WorkspaceContext.Provider
      value={{
        ms,
        error,
        refresh,
        highlight,
        requestHighlight,
        evidence,
        refreshEvidence,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
