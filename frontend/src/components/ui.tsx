"use client";
/* Small shared primitives: provenance badges (constant colors everywhere),
   readiness gauge, spinners. */
import type { SourceScope } from "@/lib/types";

export function ScopeBadge({ scope }: { scope: SourceScope | "ai" }) {
  const map: Record<string, { cls: string; label: string; dot: string }> = {
    university: { cls: "badge-university", label: "University", dot: "#D68A19" },
    public: { cls: "badge-public", label: "Public", dot: "#3155C6" },
    manuscript: { cls: "badge-manuscript", label: "Manuscript", dot: "#15956A" },
    derived: { cls: "badge-ai", label: "AI-derived", dot: "#64748B" },
    ai: { cls: "badge-ai", label: "AI", dot: "#64748B" },
  };
  const m = map[scope] || map.ai;
  return (
    <span className={`badge ${m.cls}`}>
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: m.dot }}
      />
      {m.label}
    </span>
  );
}

export function ReadinessGauge({
  value,
  size = 46,
  delta,
}: {
  value: number;
  size?: number;
  delta?: number | null;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#15956A" : value >= 45 ? "#D68A19" : "#D64545";
  return (
    <div className="relative flex items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(22,35,63,0.08)" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(value, 100)) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1), stroke 400ms" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ fontSize: size / 3.4, color }}
      >
        {value}
      </span>
      {delta != null && delta !== 0 && (
        <span
          className={`absolute -right-7 -top-1 text-xs font-bold animate-bounce ${
            delta > 0 ? "text-manuscript" : "text-danger"
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function TaskProgress({ step, progress }: { step: string; progress: number }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm text-inkmut">
        <Spinner className="h-4 w-4 text-brand-deep" />
        <span>{step || "Working…"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ink/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-deep transition-all duration-700"
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="text-brand-deep/60">{icon}</div>
      <div className="font-serif text-lg text-ink">{title}</div>
      {sub && <div className="text-sm text-inkmut max-w-sm">{sub}</div>}
      {children}
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-inkmut">
      <span className="h-1 w-14 rounded-full bg-ink/10 overflow-hidden">
        <span
          className="block h-full rounded-full bg-brand-deep/70"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      {Math.round(value * 100)}%
    </span>
  );
}
