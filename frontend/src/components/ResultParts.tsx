'use client'

/** Small shared pieces for structured tool results, in the design's language. */

export function scoreColor(score: number): string {
  if (score >= 8) return '#0f9b8e'
  if (score >= 6) return '#e0951a'
  return '#ff5a7a'
}

/** Labeled 1-10 score with a thin progress bar and justification text. */
export function ScoreBar({
  label,
  score,
  justification,
}: {
  label: string
  score: number
  justification?: string
}) {
  const color = scoreColor(score)
  return (
    <div className="py-3 border-b border-[#f2f2f4] last:border-0">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-[13px] font-semibold text-ink flex-1">{label}</span>
        <span className="text-[13px] font-bold" style={{ color }}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f2f2f4] overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 10}%`, background: color }}
        />
      </div>
      {justification && (
        <p className="text-[12.5px] text-muted leading-relaxed">{justification}</p>
      )}
    </div>
  )
}

/** Compact stat (big number + caption), used in a row of tiles. */
export function StatTile({
  value,
  label,
  color = '#14213d',
}: {
  value: string | number
  label: string
  color?: string
}) {
  return (
    <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3.5 text-center">
      <div className="text-[22px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11.5px] text-muted mt-0.5">{label}</div>
    </div>
  )
}

/** Design-mockup style labeled row: colored label column + text. */
export function LabeledRow({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5 py-3 border-b border-[#f2f2f4] last:border-0">
      <span
        className="shrink-0 w-[110px] text-xs font-semibold pt-px uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[13.5px] text-[#3c465c] leading-relaxed min-w-0">{children}</span>
    </div>
  )
}

/** Bulleted list used inside LabeledRow bodies. */
export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-light mt-[7px] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
