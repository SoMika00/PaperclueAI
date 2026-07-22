'use client'

import { useMemo, useRef, useState } from 'react'
import type { MindMap, MindMapNode } from '@/lib/mindmap'

/**
 * Interactive mind map canvas in the design's visual language (tinted
 * node circles, quiet gray links). Ported concept from the old frontend's
 * canvas, rebuilt small: radial auto-layout + drag nodes + wheel zoom +
 * background pan + click-to-inspect.
 */

const GROUP_COLORS = [
  { fill: '#6c4de6', tint: '#ede6ff' }, // violet (center)
  { fill: '#ff5a7a', tint: '#ffe6ec' }, // coral
  { fill: '#0f9b8e', tint: '#e0f7f4' }, // teal
  { fill: '#e0951a', tint: '#fff2d6' }, // amber
  { fill: '#3d7dff', tint: '#e6f0ff' }, // blue
  { fill: '#ff8a3d', tint: '#ffe9d9' }, // orange
]

type Pos = { x: number; y: number }

function radialLayout(map: MindMap): Record<string, Pos> {
  const adj = new Map<string, string[]>()
  for (const e of map.edges) {
    adj.set(e.source, [...(adj.get(e.source) ?? []), e.target])
    adj.set(e.target, [...(adj.get(e.target) ?? []), e.source])
  }

  const rootId = map.nodes.find((n) => n.group === 0)?.id ?? map.nodes[0].id
  const pos: Record<string, Pos> = { [rootId]: { x: 0, y: 0 } }
  const depth: Record<string, number> = { [rootId]: 0 }
  const angle: Record<string, number> = { [rootId]: 0 }

  let frontier = [rootId]
  const seen = new Set([rootId])
  let level = 1

  while (frontier.length) {
    const next: string[] = []
    const children: Array<{ id: string; parent: string }> = []
    for (const id of frontier) {
      for (const c of adj.get(id) ?? []) {
        if (!seen.has(c)) {
          seen.add(c)
          children.push({ id: c, parent: id })
          next.push(c)
        }
      }
    }
    const n = children.length
    children.forEach((child, i) => {
      // First ring: spread evenly. Deeper rings: fan out around the parent's angle.
      const a =
        level === 1
          ? (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
          : angle[child.parent] + ((i / Math.max(n - 1, 1)) - 0.5) * 1.4
      const r = level * 165
      angle[child.id] = a
      depth[child.id] = level
      pos[child.id] = { x: Math.cos(a) * r, y: Math.sin(a) * r }
    })
    frontier = next
    level++
  }

  // Orphans (shouldn't happen after validation, but never lose a node)
  map.nodes.forEach((node, i) => {
    if (!pos[node.id]) {
      pos[node.id] = { x: 250 + i * 30, y: 250 }
      depth[node.id] = 2
    }
  })

  return pos
}

function nodeRadius(node: MindMapNode): number {
  return node.group === 0 ? 30 : 17
}

function colorFor(node: MindMapNode) {
  return GROUP_COLORS[Math.abs(node.group) % GROUP_COLORS.length]
}

function wrapLabel(label: string): string[] {
  if (label.length <= 20) return [label]
  const words = label.split(' ')
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export function MindMapCanvas({ map }: { map: MindMap }) {
  const [positions, setPositions] = useState<Record<string, Pos>>(() => radialLayout(map))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Pos>({ x: 0, y: 0 })
  const [selected, setSelected] = useState<MindMapNode | null>(null)
  const drag = useRef<{ id: string | null; startX: number; startY: number; moved: boolean }>({
    id: null,
    startX: 0,
    startY: 0,
    moved: false,
  })
  const svgRef = useRef<SVGSVGElement>(null)

  // Fixed viewBox coordinate space; CSS scales it to the container.
  const VB_W = 1000
  const VB_H = 520

  function toViewBox(e: React.PointerEvent): Pos {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (VB_W / rect.width),
      y: (e.clientY - rect.top) * (VB_H / rect.height),
    }
  }

  function toWorld(e: React.PointerEvent): Pos {
    const p = toViewBox(e)
    return {
      x: (p.x - VB_W / 2 - pan.x) / zoom,
      y: (p.y - VB_H / 2 - pan.y) / zoom,
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
      setPositions((prev) => ({ ...prev, [d.id!]: w }))
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
      const node = map.nodes.find((n) => n.id === id) ?? null
      setSelected((prev) => (prev?.id === id ? null : node))
    }
    drag.current = { id: null, startX: 0, startY: 0, moved: false }
  }

  function onWheel(e: React.WheelEvent) {
    setZoom((z) => Math.min(2.5, Math.max(0.35, z * (e.deltaY > 0 ? 0.9 : 1.1))))
  }

  const nodeById = useMemo(
    () => Object.fromEntries(map.nodes.map((n) => [n.id, n])),
    [map.nodes]
  )

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-[420px] cursor-grab touch-none select-none"
        onPointerDown={(e) => onPointerDown(e, null)}
        onPointerMove={onPointerMove}
        onPointerUp={() => onPointerUp(null)}
        onWheel={onWheel}
      >
        <g transform={`translate(${VB_W / 2 + pan.x}, ${VB_H / 2 + pan.y}) scale(${zoom})`}>
          {map.edges.map((e, i) => {
            const a = positions[e.source]
            const b = positions[e.target]
            if (!a || !b) return null
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#d9dce6"
                strokeWidth={nodeById[e.source]?.group === 0 || nodeById[e.target]?.group === 0 ? 1.5 : 1.2}
              />
            )
          })}
          {map.nodes.map((node) => {
            const p = positions[node.id]
            if (!p) return null
            const r = nodeRadius(node)
            const c = colorFor(node)
            const center = node.group === 0
            const lines = wrapLabel(node.label)
            const isSelected = selected?.id === node.id
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
                  fill={center ? c.fill : c.tint}
                  stroke={isSelected ? c.fill : 'transparent'}
                  strokeWidth={2}
                />
                {!center && <circle r={4} fill={c.fill} />}
                {lines.map((line, i) => (
                  <text
                    key={i}
                    y={r + 14 + i * 13}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#14213d"
                  >
                    {line}
                  </text>
                ))}
                {center && (
                  <text y={4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#ffffff">
                    {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <div className="px-5 py-3.5 border-t border-border bg-background text-[13px] text-muted leading-normal">
        {selected ? (
          <>
            <span className="font-semibold text-ink">{selected.label}</span>
            {selected.summary ? ` — ${selected.summary}` : ''}
          </>
        ) : (
          'Drag nodes to rearrange · scroll to zoom · click a node to see its summary.'
        )}
      </div>
    </div>
  )
}
