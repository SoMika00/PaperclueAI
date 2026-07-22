'use client'

/**
 * Canvas for backend research maps (center + papers, cluster-sectored).
 * Same interaction model as the topic canvas (drag / zoom / pan / click)
 * with the research semantics: node color = provenance (source_scope from
 * the API), solid edge = cites, dashed = similar topic. Nodes expand via
 * the S2 recommendations endpoint.
 */
import { useMemo, useRef, useState } from 'react'
import type { MapEdge, MapGap, MapNode } from '@/lib/backend-types'
import { PROVENANCE } from '@/components/Provenance'
import { PaperTools } from '@/components/PaperTools'

type Pos = { x: number; y: number }
type Graph = { nodes: MapNode[]; edges: MapEdge[]; gaps: MapGap[] }

const VB_W = 1000
const VB_H = 560

function layout(graph: Graph): Record<string, Pos> {
  const pos: Record<string, Pos> = {}
  const center = graph.nodes.find((n) => n.type === 'center')
  const centerId = center?.id ?? 'center'
  pos[centerId] = { x: 0, y: 0 }

  // Depth-1 = direct neighbors of center, grouped into cluster sectors.
  const adj = new Map<string, string[]>()
  for (const e of graph.edges) {
    adj.set(e.source, [...(adj.get(e.source) ?? []), e.target])
    adj.set(e.target, [...(adj.get(e.target) ?? []), e.source])
  }

  const level1 = (adj.get(centerId) ?? []).filter((id) => id !== centerId)
  const byCluster = new Map<string, string[]>()
  for (const id of level1) {
    const node = graph.nodes.find((n) => n.id === id)
    const key = node?.cluster ?? '—'
    byCluster.set(key, [...(byCluster.get(key) ?? []), id])
  }

  const clusters = [...byCluster.entries()]
  const total = level1.length || 1
  let angleCursor = -Math.PI / 2
  const placed = new Set([centerId])

  for (const [, ids] of clusters) {
    const span = (2 * Math.PI * ids.length) / total
    ids.forEach((id, i) => {
      const a = angleCursor + (span * (i + 0.5)) / ids.length
      const r = 190 + (i % 2) * 55
      pos[id] = { x: Math.cos(a) * r, y: Math.sin(a) * r }
      placed.add(id)
    })
    angleCursor += span
  }

  // Deeper nodes (from expansion): fan around their parent.
  let frontier = [...level1]
  let depth = 2
  while (frontier.length) {
    const next: string[] = []
    for (const parentId of frontier) {
      const children = (adj.get(parentId) ?? []).filter((c) => !placed.has(c))
      children.forEach((child, i) => {
        const p = pos[parentId]
        const baseAngle = Math.atan2(p.y, p.x)
        const a = baseAngle + ((i / Math.max(children.length - 1, 1)) - 0.5) * 1.1
        const r = Math.hypot(p.x, p.y) + 130
        pos[child] = { x: Math.cos(a) * r, y: Math.sin(a) * r }
        placed.add(child)
        next.push(child)
      })
    }
    frontier = next
    if (++depth > 6) break
  }

  graph.nodes.forEach((n, i) => {
    if (!pos[n.id]) pos[n.id] = { x: 300 + (i % 5) * 40, y: 240 }
  })
  return pos
}

export function ResearchMapCanvas({
  graph,
  onExpand,
  expandingId,
}: {
  graph: Graph
  onExpand?: (nodeId: string) => void
  expandingId?: string | null
}) {
  // Base layout is derived purely from the graph; user drags live in
  // `overrides`, so nodes added by expansion get positions automatically
  // without resetting anything the user moved.
  const basePositions = useMemo(() => layout(graph), [graph])
  const [overrides, setOverrides] = useState<Record<string, Pos>>({})
  const positions = useMemo(
    () => ({ ...basePositions, ...overrides }),
    [basePositions, overrides]
  )
  const [zoom, setZoom] = useState(0.9)
  const [pan, setPan] = useState<Pos>({ x: 0, y: 0 })
  const [selected, setSelected] = useState<MapNode | null>(null)
  const [hiddenScopes, setHiddenScopes] = useState<Set<string>>(new Set())
  const [gapFocus, setGapFocus] = useState<Set<string> | null>(null)
  const drag = useRef<{ id: string | null; startX: number; startY: number; moved: boolean }>({
    id: null,
    startX: 0,
    startY: 0,
    moved: false,
  })
  const svgRef = useRef<SVGSVGElement>(null)

  const nodeById = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n])),
    [graph.nodes]
  )

  const stats = useMemo(() => {
    const papers = graph.nodes.filter((n) => n.type === 'paper').length
    const families = new Set(graph.nodes.map((n) => n.cluster).filter(Boolean)).size
    const cited = graph.edges.filter((e) => e.relation_type === 'cites').length
    return { papers, families, cited, gaps: graph.gaps?.length ?? 0 }
  }, [graph])

  function isVisible(n: MapNode) {
    if (n.type === 'center') return true
    if (hiddenScopes.has(n.source_scope)) return false
    if (gapFocus && !gapFocus.has(n.id)) return false
    return true
  }

  function toWorld(e: React.PointerEvent): Pos {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * (VB_W / rect.width) - VB_W / 2 - pan.x) / zoom,
      y: ((e.clientY - rect.top) * (VB_H / rect.height) - VB_H / 2 - pan.y) / zoom,
    }
  }

  function onPointerDown(e: React.PointerEvent, id: string | null) {
    e.stopPropagation()
    drag.current = { id, startX: e.clientX, startY: e.clientY, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (d.startX === 0 && d.startY === 0) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (!d.moved) return
    if (d.id) {
      const w = toWorld(e)
      setOverrides((prev) => ({ ...prev, [d.id!]: w }))
    } else {
      const rect = svgRef.current!.getBoundingClientRect()
      setPan((prev) => ({
        x: prev.x + dx * (VB_W / rect.width),
        y: prev.y + dy * (VB_H / rect.height),
      }))
      d.startX = e.clientX
      d.startY = e.clientY
    }
  }

  function onPointerUp(id: string | null) {
    const d = drag.current
    if (!d.moved && id) {
      setSelected((prev) => (prev?.id === id ? null : nodeById[id] ?? null))
    }
    drag.current = { id: null, startX: 0, startY: 0, moved: false }
  }

  function toggleScope(scope: string) {
    setHiddenScopes((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  const meta = (selected?.meta ?? {}) as {
    tldr?: string
    venue?: string
    citation_count?: number
    url?: string
    authors?: string[]
  }

  return (
    <div>
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border bg-background text-[12px]">
        <span className="text-muted">
          {stats.papers} papers · {stats.families} research families · {stats.cited} cited ·{' '}
          {stats.gaps} gaps
        </span>
        <span className="flex-1" />
        {(['manuscript', 'university', 'public'] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => toggleScope(scope)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium border transition-colors"
            style={{
              color: hiddenScopes.has(scope) ? '#b0b0b8' : PROVENANCE[scope].color,
              background: hiddenScopes.has(scope) ? 'transparent' : PROVENANCE[scope].tint,
              borderColor: hiddenScopes.has(scope) ? '#eaeaea' : 'transparent',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: hiddenScopes.has(scope) ? '#b0b0b8' : PROVENANCE[scope].color }}
            />
            {PROVENANCE[scope].label}
          </button>
        ))}
        {gapFocus && (
          <button
            onClick={() => setGapFocus(null)}
            className="text-node-amber font-semibold hover:opacity-80"
          >
            clear gap focus ×
          </button>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-[460px] cursor-grab touch-none select-none"
        onPointerDown={(e) => onPointerDown(e, null)}
        onPointerMove={onPointerMove}
        onPointerUp={() => onPointerUp(null)}
        onWheel={(e) => setZoom((z) => Math.min(2.5, Math.max(0.3, z * (e.deltaY > 0 ? 0.9 : 1.1))))}
      >
        <g transform={`translate(${VB_W / 2 + pan.x}, ${VB_H / 2 + pan.y}) scale(${zoom})`}>
          {graph.edges.map((e) => {
            const a = positions[e.source]
            const b = positions[e.target]
            const na = nodeById[e.source]
            const nb = nodeById[e.target]
            if (!a || !b || !na || !nb || !isVisible(na) || !isVisible(nb)) return null
            const color = PROVENANCE[e.source_scope]?.color ?? '#d9dce6'
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={e.relation_type === 'cites' ? 1.8 : 1.2}
                strokeDasharray={e.relation_type === 'cites' ? undefined : '4 4'}
              />
            )
          })}
          {graph.nodes.map((node) => {
            const p = positions[node.id]
            if (!p || !isVisible(node)) return null
            const isCenter = node.type === 'center'
            const prov = PROVENANCE[node.source_scope] ?? PROVENANCE.public
            const r = isCenter ? 26 : 13
            const isSelected = selected?.id === node.id
            const label =
              node.label.length > 34 ? node.label.slice(0, 32) + '…' : node.label
            return (
              <g
                key={node.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                onPointerDown={(e) => onPointerDown(e, node.id)}
                onPointerUp={(e) => {
                  e.stopPropagation()
                  onPointerUp(node.id)
                }}
              >
                <circle
                  r={r}
                  fill={isCenter ? '#14213d' : prov.tint}
                  stroke={isSelected ? prov.color : isCenter ? '#ff8a3d' : 'transparent'}
                  strokeWidth={isSelected ? 2.5 : isCenter ? 2 : 0}
                />
                {!isCenter && <circle r={4.5} fill={prov.color} />}
                {!isCenter && (
                  <text y={r + 12} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#3c465c">
                    {label}
                  </text>
                )}
                {isCenter && (
                  <text y={3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#ffffff">
                    {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Selected node detail */}
      <div className="px-4 py-3 border-t border-border bg-background min-h-[72px]">
        {selected && selected.type === 'paper' ? (
          <div>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink leading-snug">
                  {meta.url ? (
                    <a href={meta.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                      {selected.label}
                    </a>
                  ) : (
                    selected.label
                  )}
                </div>
                <div className="text-[11.5px] text-muted mt-0.5">
                  {[
                    meta.authors?.slice(0, 3).join(', '),
                    meta.venue,
                    selected.year,
                    typeof meta.citation_count === 'number' ? `${meta.citation_count} citations` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {selected.why && (
                  <p className="text-[12px] text-[#3c465c] mt-1.5 leading-relaxed">
                    <span className="font-semibold" style={{ color: PROVENANCE[selected.source_scope]?.color }}>
                      Why it&rsquo;s here:
                    </span>{' '}
                    {selected.why}
                  </p>
                )}
                {meta.tldr && !selected.why && (
                  <p className="text-[12px] text-[#3c465c] mt-1.5 leading-relaxed line-clamp-2">{meta.tldr}</p>
                )}
              </div>
              {onExpand && (
                <button
                  onClick={() => onExpand(selected.id)}
                  disabled={expandingId !== null && expandingId !== undefined}
                  className="shrink-0 bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg px-3 py-2 transition-colors"
                >
                  {expandingId === selected.id ? 'Expanding…' : 'Expand branch'}
                </button>
              )}
            </div>
            {/* The seven paper tools, on every suggested paper in the map. */}
            <div className="mt-3">
              <PaperTools corpusId={selected.id} compact />
            </div>
          </div>
        ) : (
          <p className="text-[12.5px] text-muted">
            Click a paper for its details and &ldquo;why it&rsquo;s here&rdquo; · drag to
            rearrange · scroll to zoom. Solid edges = cited by the manuscript, dashed =
            similar topic.
          </p>
        )}
      </div>

      {/* Gap finder */}
      {graph.gaps && graph.gaps.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[1.4px] text-node-amber">
            GAP FINDER
          </div>
          {graph.gaps.map((g, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-[#f2f2f4] last:border-0">
              <p className="text-[12.5px] text-[#3c465c] leading-snug flex-1">{g.message}</p>
              <button
                onClick={() => setGapFocus(new Set(g.paper_ids))}
                className="shrink-0 text-[12px] font-semibold text-node-amber hover:opacity-80"
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
