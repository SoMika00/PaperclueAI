'use client'

import { useCallback, useEffect, useState } from 'react'
import { ResearchMapCanvas } from '@/components/ResearchMapCanvas'
import { api, pollTask } from '@/lib/api'
import type { MindMapRecord } from '@/lib/backend-types'
import { useWorkspace } from '@/lib/workspace'

export default function ManuscriptMindMapPage() {
  const { ms } = useWorkspace()
  const [maps, setMaps] = useState<MindMapRecord[] | null>(null)
  const [current, setCurrent] = useState<MindMapRecord | null>(null)
  const [building, setBuilding] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expandingId, setExpandingId] = useState<string | null>(null)

  const loadMaps = useCallback(
    (withCurrent: boolean) => {
      if (!ms) return Promise.resolve()
      return api<MindMapRecord[]>(`/mindmaps?manuscript_id=${ms.id}`)
        .then(async (list) => {
          setMaps(list)
          const ready = list.find((m) => m.status === 'ready')
          if (ready && withCurrent) {
            setCurrent(await api<MindMapRecord>(`/mindmaps/${ready.id}`))
          }
        })
        .catch(() => setMaps([]))
    },
    [ms]
  )

  useEffect(() => {
    void loadMaps(true)
  }, [loadMaps])

  async function buildMap() {
    if (!ms) return
    setBuilding(true)
    setError(null)
    try {
      const { id, task_id } = await api<{ id: string; task_id: string }>('/mindmaps', {
        method: 'POST',
        body: JSON.stringify({ seed_type: 'manuscript', manuscript_id: ms.id }),
      })
      const task = await pollTask(task_id, (t) => setStep(t.step || ''))
      if (task.status === 'error') {
        setError(task.error ?? 'Map generation failed.')
      } else {
        setCurrent(await api<MindMapRecord>(`/mindmaps/${id}`))
        void loadMaps(false)
      }
    } catch (e) {
      setError(`Map generation failed. ${e instanceof Error ? e.message.slice(0, 200) : ''}`)
    } finally {
      setBuilding(false)
    }
  }

  async function expand(nodeId: string) {
    if (!current) return
    setExpandingId(nodeId)
    setError(null)
    try {
      const { graph } = await api<{ added: number; graph: MindMapRecord['graph'] }>(
        `/mindmaps/${current.id}/expand`,
        { method: 'POST', body: JSON.stringify({ node_id: nodeId }) }
      )
      setCurrent((prev) => (prev ? { ...prev, graph } : prev))
    } catch (e) {
      setError(
        /429/.test(String(e))
          ? 'Public API rate-limited — retry the expansion in a minute.'
          : `Expansion failed. ${e instanceof Error ? e.message.slice(0, 160) : ''}`
      )
    } finally {
      setExpandingId(null)
    }
  }

  return (
    <div className="max-w-[1360px] mx-auto px-8 pt-5 pb-10">
      {error && (
        <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {!current && (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <p className="text-[13px] text-muted max-w-[480px] mx-auto mb-5">
            Build a research map around this manuscript: its verified references, similar
            public papers, and university work — clustered into research families, with the
            gaps your citations don&rsquo;t cover.
          </p>
          <button
            onClick={buildMap}
            disabled={building || !ms}
            className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-sm font-semibold rounded-[9px] px-5 py-2.5 transition-colors"
          >
            {building ? step || 'Building the map…' : 'Build research map'}
          </button>
          {maps && maps.length > 0 && (
            <div className="mt-5 text-[12px] text-muted-light">
              {maps.length} earlier map{maps.length > 1 ? 's' : ''} for this manuscript —
              latest shown once ready.
            </div>
          )}
        </div>
      )}

      {current?.graph && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-node-violet shrink-0" />
            <span className="text-sm font-semibold text-ink truncate">{current.title}</span>
            <span className="flex-1" />
            <button
              onClick={buildMap}
              disabled={building}
              className="text-[12px] font-semibold text-muted hover:text-ink transition-colors"
            >
              {building ? step || 'Rebuilding…' : 'Rebuild'}
            </button>
          </div>
          <ResearchMapCanvas graph={current.graph} onExpand={expand} expandingId={expandingId} />
        </div>
      )}
    </div>
  )
}
