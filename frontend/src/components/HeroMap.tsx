"use client";
/* The 5-second product explainer: an animated mini research map — a manuscript
   at the center, papers connecting from both corpora, then a literature-gap
   card appears. Pure SVG/CSS, loops forever, no fake user data. */
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const PUB = "#3155C6";
const UNI = "#D68A19";
const MS = "#15956A";
const CENTER_X = 155;
const CENTER_Y = 96;

const NODES: { x: number; y: number; c: string; d: number }[] = [
  { x: 62, y: 42, c: PUB, d: 0.6 },
  { x: 246, y: 34, c: PUB, d: 1.4 },
  { x: 270, y: 132, c: UNI, d: 2.2 },
  { x: 44, y: 138, c: UNI, d: 3.0 },
  { x: 150, y: 24, c: PUB, d: 3.8 },
];

function edgeLength(x: number, y: number) {
  return Math.round(Math.hypot(x - CENTER_X, y - CENTER_Y));
}

export default function HeroMap() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardBg = isDark ? "#0F2340" : "#DCF2EA";
  const cardText = isDark ? "#E7EEF9" : "#101828";
  const gapBg = isDark ? "#15315A" : undefined;
  const gapText = isDark ? "#E7EEF9" : undefined;

  return (
    <div className="relative select-none px-6 py-4" aria-hidden>
      <svg viewBox="0 0 310 190" className="w-full max-w-[300px] h-auto">
        <style>{`
          .hm-node { opacity: 0; animation: hmPop 9s ease-out infinite; }
          @keyframes hmPop {
            0% { opacity: 0; } 6% { opacity: 1; }
            88% { opacity: 1; } 96%, 100% { opacity: 0; }
          }
          .hm-pulse { animation: hmPulse 2.4s ease-in-out infinite; transform-origin: 155px 96px; }
          @keyframes hmPulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.05);} }
        `}</style>

        {NODES.map((n, i) => {
          const len = edgeLength(n.x, n.y);
          return (
            <line
              key={`e${i}`}
              x1={CENTER_X} y1={CENTER_Y} x2={n.x} y2={n.y}
              stroke={n.c}
              strokeWidth={i === 2 || i === 3 ? 2.2 : 1.4}
              strokeDasharray={len}
              opacity={0.75}
              style={{
                strokeDashoffset: len,
                animation: `hmDraw${i} 9s ease-in-out infinite`,
                animationDelay: `${n.d}s`,
              }}
            >
              <style>{`
                @keyframes hmDraw${i} {
                  0% { stroke-dashoffset: ${len}; }
                  10% { stroke-dashoffset: 0; }
                  88% { stroke-dashoffset: 0; opacity: 0.75; }
                  96%, 100% { stroke-dashoffset: 0; opacity: 0; }
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
          <rect x={105} y={78} width={100} height={36} rx={9}
            fill={cardBg} stroke={MS} strokeWidth={2} />
          <text x={155} y={93} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={MS}>
            {t("heromap_manuscript")}
          </text>
          <text x={155} y={105} textAnchor="middle" fontSize={7} fill={cardText}>
            {t("heromap_anchored")}
          </text>
        </g>
      </svg>

      {/* near node 2 (UNI, bottom-right) */}
      <div
        className="absolute rounded-lg border px-2.5 py-1.5 shadow-card max-w-[150px] w-max"
        style={{
          left: "68%", top: "78%",
          animation: "hmPop 9s ease-out infinite", animationDelay: "5s", opacity: 0,
          backgroundColor: isDark ? "#15315A" : "#FBF0DC", borderColor: "rgba(214,138,25,0.6)",
        }}
      >
        <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: UNI }}>
          {t("heromap_gap_title")}
        </div>
        <div className="text-[9px] leading-snug" style={{ color: gapText }}>
          {t("heromap_gap_desc")}
        </div>
      </div>

      {/* near node 1 (PUB, top-right) */}
      <div
        className="absolute rounded-lg border px-2.5 py-1.5 shadow-card max-w-[150px] w-max"
        style={{
          left: "58%", top: "-8%",
          animation: "hmPop 9s ease-out infinite", animationDelay: "8s", opacity: 0,
          backgroundColor: isDark ? "#0F2340" : "#E2E8F8", borderColor: "rgba(49,85,198,0.6)",
        }}
      >
        <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: PUB }}>
          {t("heromap_verified_title")}
        </div>
        <div className="text-[9px] leading-snug" style={{ color: gapText }}>
          {t("heromap_verified_desc")}
        </div>
      </div>

      {/* near node 3 (UNI, bottom-left) */}
      <div
        className="absolute rounded-lg border px-2.5 py-1.5 shadow-card max-w-[150px] w-max"
        style={{
          left: "-8%", top: "85%",
          animation: "hmPop 9s ease-out infinite", animationDelay: "2s", opacity: 0,
          backgroundColor: isDark ? "#0F2340" : "#DCF2EA", borderColor: "rgba(21,149,106,0.6)",
        }}
      >
        <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MS }}>
          {t("heromap_related_title")}
        </div>
        <div className="text-[9px] leading-snug" style={{ color: gapText }}>
          {t("heromap_related_desc")}
        </div>
      </div>
    </div>
  );
}
