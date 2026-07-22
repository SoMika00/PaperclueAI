'use client'

export function ReadinessGauge({ value, size = 40 }: { value: number; size?: number }) {
  const color = value >= 70 ? '#0f9b8e' : value >= 40 ? '#e0951a' : '#ff5a7a'
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, value) / 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eaeaea" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[12px] font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  )
}
