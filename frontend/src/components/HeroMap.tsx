"use client";
/* The 5-second product explainer: an animated mini research map — a manuscript
   at the center, papers connecting from both corpora — followed by three
   annotation cards that fade in in sequence, then a color legend. Pure SVG/CSS,
   loops forever, no fake user data. Laid out in clean flow (map → cards →
   legend) so nothing overlaps at any width. */
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const PUB = "#3D7DFF";
const UNI = "#E0951A";
const MS = "#0F9B8E";
const CENTER_X = 180;
const CENTER_Y = 96;

const NODES: { x: number; y: number; c: string; d: number }[] = [
  { x: 54, y: 40, c: PUB, d: 0.4 },
  { x: 306, y: 34, c: PUB, d: 1.0 },
  { x: 316, y: 150, c: UNI, d: 1.6 },
  { x: 44, y: 150, c: UNI, d: 2.2 },
];

function edgeLength(x: number, y: number) {
  return Math.round(Math.hypot(x - CENTER_X, y - CENTER_Y));
}

export default function HeroMap() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardBg = isDark ? "#14213D" : "#E0F7F4";
  const cardText = isDark ? "#E7EEF9" : "#14213D";

  // Annotation cards — shown in a clean row below the map, each fading in on a
  // stagger so it reads as a sequence, then the whole set loops.
  const cards = [
    { c: MS, delay: "0.6s", title: t("heromap_related_title"), desc: t("heromap_related_desc") },
    { c: PUB, delay: "1.4s", title: t("heromap_verified_title"), desc: t("heromap_verified_desc") },
    { c: UNI, delay: "2.2s", title: t("heromap_gap_title"), desc: t("heromap_gap_desc") },
  ];

  const legend = [
    { c: MS, label: t("heromap_manuscript_short") },
    { c: UNI, label: t("nav_university") },
    { c: PUB, label: t("heromap_legend_public") },
  ];

  return (
    <div className="w-full max-w-[420px] select-none" aria-hidden>
      <style>{`
        .hm-node { opacity: 0; animation: hmPop 9s ease-out infinite; }
        @keyframes hmPop { 0% { opacity: 0; } 6% { opacity: 1; } 92% { opacity: 1; } 98%, 100% { opacity: 0; } }
        .hm-pulse { animation: hmPulse 2.4s ease-in-out infinite; transform-origin: ${CENTER_X}px ${CENTER_Y}px; }
        @keyframes hmPulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.04);} }
        .hm-card { opacity: 0; animation: hmCard 9s ease-out infinite; }
        @keyframes hmCard { 0% { opacity: 0; transform: translateY(6px); } 10% { opacity: 1; transform: translateY(0); } 92% { opacity: 1; } 98%, 100% { opacity: 0; } }
      `}</style>

      <svg viewBox="0 0 360 196" className="w-full h-auto">
        {NODES.map((n, i) => {
          const len = edgeLength(n.x, n.y);
          return (
            <line
              key={`e${i}`}
              x1={CENTER_X} y1={CENTER_Y} x2={n.x} y2={n.y}
              stroke={n.c}
              strokeWidth={i === 2 || i === 3 ? 2.2 : 1.4}
              strokeDasharray={len}
              opacity={0.7}
              style={{ strokeDashoffset: len, animation: `hmDraw${i} 9s ease-in-out infinite`, animationDelay: `${n.d}s` }}
            >
              <style>{`
                @keyframes hmDraw${i} {
                  0% { stroke-dashoffset: ${len}; opacity: 0; }
                  10% { stroke-dashoffset: 0; opacity: 0.7; }
                  92% { stroke-dashoffset: 0; opacity: 0.7; }
                  98%, 100% { opacity: 0; }
                }
              `}</style>
            </line>
          );
        })}

        {NODES.map((n, i) => (
          <g key={`n${i}`} className="hm-node" style={{ animationDelay: `${n.d}s` }}>
            <circle cx={n.x} cy={n.y} r={9} fill="white" stroke={n.c} strokeWidth={2.5} />
            <circle cx={n.x} cy={n.y} r={3} fill={n.c} />
          </g>
        ))}

        <g className="hm-pulse">
          <rect x={CENTER_X - 52} y={CENTER_Y - 18} width={104} height={36} rx={10}
            fill={cardBg} stroke={MS} strokeWidth={2} />
          <text x={CENTER_X} y={CENTER_Y - 3} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={MS}>
            {t("heromap_manuscript")}
          </text>
          <text x={CENTER_X} y={CENTER_Y + 9} textAnchor="middle" fontSize={7} fill={cardText}>
            {t("heromap_anchored")}
          </text>
        </g>
      </svg>

      {/* Annotation cards — aligned row, sequenced fade-in */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div
            key={c.title}
            className="hm-card rounded-lg border bg-paper dark:bg-dark-surface px-2.5 py-1.5 shadow-card"
            style={{ borderColor: `${c.c}66`, animationDelay: c.delay }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wide leading-tight" style={{ color: c.c }}>
              {c.title}
            </div>
            <div className="text-[9.5px] leading-snug text-inkmut dark:text-dark-inkmut mt-0.5">
              {c.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Color legend — every node color maps to a source scope */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-inkmut dark:text-dark-inkmut">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.c }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
