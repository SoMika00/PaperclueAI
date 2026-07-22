/**
 * Mind map over the deployed `mind-map` edge function. Contract verified
 * live (2026-07-15): request `{ topic: string }` (keywords mode, the only
 * implemented mode) → response `{ keywords: [{ keyword, description }] }`.
 * We shape that into a radial map client-side — the same area→keywords
 * flow the old frontend used.
 */

export type MindMapNode = {
  id: string
  label: string
  group: number
  summary?: string
}

export type MindMapEdge = { source: string; target: string }

export type MindMap = {
  title: string
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

export type KeywordEntry = { keyword: string; description?: string }

/** Build the canvas model from the keywords response. */
export function keywordsToMindMap(topic: string, keywords: KeywordEntry[]): MindMap | null {
  const valid = keywords.filter((k) => k && typeof k.keyword === 'string' && k.keyword.trim())
  if (valid.length === 0) return null

  const nodes: MindMapNode[] = [
    { id: 'center', label: topic.slice(0, 80), group: 0 },
    ...valid.map((k, i) => ({
      id: `k${i}`,
      label: k.keyword.slice(0, 80),
      group: (i % 5) + 1,
      summary: typeof k.description === 'string' ? k.description : undefined,
    })),
  ]

  const edges: MindMapEdge[] = valid.map((_, i) => ({ source: 'center', target: `k${i}` }))

  return { title: topic.slice(0, 60), nodes, edges }
}

/** Pull the keywords array out of the raw edge-function response. */
export function parseKeywordsResponse(response: unknown): KeywordEntry[] {
  if (
    response &&
    typeof response === 'object' &&
    Array.isArray((response as { keywords?: unknown }).keywords)
  ) {
    return (response as { keywords: KeywordEntry[] }).keywords
  }
  return []
}
