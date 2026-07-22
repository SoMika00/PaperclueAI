import type { SourceScope } from '@/lib/backend-types'

/**
 * Provenance is semantic: source_scope comes from the API on every paper,
 * node and edge — never inferred client-side. Colors remap the backend's
 * green/amber/indigo convention into our palette.
 */
export const PROVENANCE: Record<string, { color: string; tint: string; label: string }> = {
  manuscript: { color: '#0f9b8e', tint: '#e0f7f4', label: 'My research' },
  university: { color: '#e0951a', tint: '#fff2d6', label: 'University' },
  public: { color: '#3d7dff', tint: '#e6f0ff', label: 'Public' },
  derived: { color: '#6c4de6', tint: '#ede6ff', label: 'Derived' },
}

export function ProvenanceBadge({ scope }: { scope: SourceScope | string }) {
  const p = PROVENANCE[scope] ?? PROVENANCE.public
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
      style={{ color: p.color, background: p.tint }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
      {p.label}
    </span>
  )
}
