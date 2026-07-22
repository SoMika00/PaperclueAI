'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { ResearchMapCanvas } from '@/components/ResearchMapCanvas'
import { api } from '@/lib/api'
import type { MindMapRecord } from '@/lib/backend-types'
import { useRequireAccount } from '@/lib/use-account'

export default function MindMapViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const blocked = useRequireAccount()
  const [map, setMap] = useState<MindMapRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandingId, setExpandingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(
    () =>
      api<MindMapRecord>(`/mindmaps/${id}`)
        .then(setMap)
        .catch((e) =>
          setError(
            /404/.test(String(e))
              ? 'Map not found.'
              : 'The research backend is unreachable right now.'
          )
        ),
    [id]
  )

  useEffect(() => {
    if (blocked) return
    void load()
  }, [blocked, load])

  // A just-created map may still be building — poll until ready.
  useEffect(() => {
    if (!map || map.status !== 'building') return
    pollRef.current = setInterval(() => void load(), 2000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [map, load])

  async function expand(nodeId: string) {
    if (!map) return
    setExpandingId(nodeId)
    try {
      const { graph } = await api<{ graph: MindMapRecord['graph'] }>(
        `/mindmaps/${map.id}/expand`,
        { method: 'POST', body: JSON.stringify({ node_id: nodeId }) }
      )
      setMap((prev) => (prev ? { ...prev, graph } : prev))
    } catch (e) {
      setError(
        /429/.test(String(e))
          ? 'Public API rate-limited — retry the expansion in a minute.'
          : 'Expansion failed.'
      )
    } finally {
      setExpandingId(null)
    }
  }

  async function toggleSaved() {
    if (!map) return
    setSaving(true)
    try {
      await api(`/mindmaps/${map.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ saved: !map.saved }),
      })
      setMap((prev) => (prev ? { ...prev, saved: !prev.saved } : prev))
    } catch {
      /* non-fatal */
    } finally {
      setSaving(false)
    }
  }

  if (blocked) {
    return (
      <AppShell crumb="Mind map">
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb={map?.title ?? 'Mind map'}>
      <div className="max-w-[1360px] mx-auto px-8 pt-7 pb-16">
        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {map?.status === 'building' && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-11 h-11 rounded-full bg-node-violet-bg flex items-center justify-center animate-pc-pulse">
              <span className="w-3.5 h-3.5 rounded-[4px] rotate-45 bg-node-violet" />
            </div>
            <div className="text-[13px] text-muted">
              Building the map — retrieving, clustering, explaining&hellip;
            </div>
          </div>
        )}

        {map?.status === 'error' && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3">
            {map.error ?? 'Map generation failed.'}
          </div>
        )}

        {map?.graph && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-node-violet shrink-0" />
              <span className="text-sm font-semibold text-ink truncate">{map.title}</span>
              <span className="flex-1" />
              <button
                onClick={toggleSaved}
                disabled={saving}
                className={`text-[12px] font-semibold transition-colors ${
                  map.saved ? 'text-node-teal' : 'text-muted hover:text-ink'
                }`}
              >
                {map.saved ? '★ Saved' : '☆ Save to my maps'}
              </button>
            </div>
            <ResearchMapCanvas graph={map.graph} onExpand={expand} expandingId={expandingId} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
