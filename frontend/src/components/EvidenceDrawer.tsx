"use client";
/* Evidence Ledger drawer: contextual, closed by default, resizable.
   Groups proofs by kind; each shows a graded support status. Clicking a
   manuscript-span proof highlights the PDF; a paper proof opens the source. */
import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  HelpCircle,
  X,
} from "lucide-react";
import type { EvidenceItem } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { ScopeBadge } from "./ui";

const KIND_LABEL: Record<string, string> = {
  insight: "Insights",
  review: "Review issues",
  citation: "Citation checks",
  browse: "Literature claims",
  format: "Journal compliance",
};

/* Graded support statuses (never a binary "true"). */
function supportOf(e: EvidenceItem): { label: string; icon: React.ReactNode; cls: string } {
  if (e.status === "conflict")
    return {
      label: "Conflict",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      cls: "text-danger",
    };
  if (e.status === "unverified")
    return {
      label: "Unresolved",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      cls: "text-aigray",
    };
  if (e.confidence >= 0.85)
    return {
      label: "Direct support",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      cls: "text-manuscript",
    };
  if (e.confidence >= 0.7)
    return {
      label: "Partial support",
      icon: <CircleDot className="h-3.5 w-3.5" />,
      cls: "text-brand-deep",
    };
  return {
    label: "Contextual support",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    cls: "text-inkmut",
  };
}

export default function EvidenceDrawer() {
  const { evidence, requestHighlight, setDrawerOpen } = useWorkspace();
  const [filter, setFilter] = useState<string>("all");
  const [width, setWidth] = useState(360);
  const dragging = useRef(false);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (dragging.current)
        setWidth(Math.min(Math.max(window.innerWidth - ev.clientX, 280), 620));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const kinds = ["all", ...Array.from(new Set(evidence.map((e) => e.kind)))];
  const items = filter === "all" ? evidence : evidence.filter((e) => e.kind === filter);

  const open = (e: EvidenceItem) => {
    const ref = e.source_ref || {};
    if (e.source_type === "manuscript_span") {
      requestHighlight(ref.page, ref.quote, e.kind === "review" ? "review" : "insight");
    } else if (ref.url) {
      window.open(ref.url, "_blank", "noopener");
    }
  };

  return (
    <aside
      className="absolute right-0 top-0 bottom-0 z-30 bg-paper border-l border-line shadow-drawer flex drawer-enter"
      style={{ width }}
    >
      <div
        onMouseDown={startDrag}
        className="w-1.5 shrink-0 cursor-col-resize hover:bg-brand/40 transition-colors"
        title="Drag to resize"
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 pt-3.5 pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-brand" />
            <span className="font-serif font-semibold">Evidence Ledger</span>
            <span className="text-[11px] text-inkmut">{evidence.length}</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="ml-auto text-inkmut hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                  filter === k
                    ? "bg-brand text-white border-brand"
                    : "border-line text-inkmut hover:bg-surface2"
                }`}
              >
                {k === "all" ? "All" : KIND_LABEL[k] || k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto panel-scroll px-3 py-2 flex flex-col divide-y divide-line/60">
          {items.length === 0 && (
            <div className="text-center text-xs text-inkmut py-10 px-4">
              No evidence yet — run Insight, a Review or a literature search.
            </div>
          )}
          {items.map((e) => {
            const ref = e.source_ref || {};
            const isSpan = e.source_type === "manuscript_span";
            const support = supportOf(e);
            return (
              <button
                key={e.id}
                onClick={() => open(e)}
                className="text-left py-2.5 px-1 hover:bg-surface2/60 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className={support.cls}>{support.icon}</span>
                  <span className={`text-[10px] font-semibold ${support.cls}`}>
                    {support.label}
                  </span>
                  <span className="text-[10px] text-inkmut">
                    · {KIND_LABEL[e.kind] || e.kind}
                  </span>
                  <span className="ml-auto">
                    {isSpan ? (
                      <ScopeBadge scope="manuscript" />
                    ) : (
                      <ScopeBadge
                        scope={e.source_type === "university_paper" ? "university" : "public"}
                      />
                    )}
                  </span>
                </div>
                <p className="text-xs leading-snug mt-1 text-ink line-clamp-3">{e.claim}</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-brand-deep opacity-70 group-hover:opacity-100">
                  {isSpan ? (
                    <>
                      {ref.page ? `p.${ref.page}` : ""}
                      {ref.section ? ` · ${ref.section}` : ""}
                      {ref.quote ? " → highlight in PDF" : ""}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      {(ref.title || "").slice(0, 60) || "Open source paper"}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
