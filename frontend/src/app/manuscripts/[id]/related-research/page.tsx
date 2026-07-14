"use client";
/* Related Research: the manuscript-scoped search. PaperClue's approach —
   the seed is the manuscript itself: suggested queries are generated from
   its extracted concepts and detected gaps, and the same seed feeds the
   research map (one button away). Findings land in the Evidence Ledger. */
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Lightbulb, Network, Sparkles } from "lucide-react";
import LiteratureSearch from "@/components/LiteratureSearch";
import { Spinner } from "@/components/ui";
import { useWorkspace } from "@/lib/ws";

export default function RelatedResearchPage() {
  const { ms, refreshEvidence } = useWorkspace();
  const [prefill, setPrefill] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(refreshEvidence, 8000);
    return () => clearInterval(t);
  }, [refreshEvidence]);

  // Suggested searches generated from the manuscript's own content.
  const suggestions = useMemo(() => {
    const insight: any = ms.insight || {};
    const out: { label: string; q: string; kind: "concept" | "gap" }[] = [];
    const kws: string[] = insight.keywords || [];
    if (kws.length >= 2)
      out.push({ label: kws.slice(0, 3).join(" + "), q: kws.slice(0, 3).join(" "), kind: "concept" });
    for (const k of kws.slice(3, 6))
      out.push({ label: k, q: `${k} ${ms.field_of_study || ""}`.trim(), kind: "concept" });
    for (const g of (insight.gap_hints || []).slice(0, 2))
      out.push({ label: g.slice(0, 70), q: g.slice(0, 160), kind: "gap" });
    return out.slice(0, 5);
  }, [ms]);

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl font-semibold">Related Research</h1>
            <p className="text-sm text-inkmut mt-0.5">
              Search the literature around this manuscript — results feed its
              Evidence Ledger.
            </p>
          </div>
          <Link
            href={`/manuscripts/${ms.id}/mind-map`}
            className="btn btn-primary shrink-0"
          >
            <Network className="h-4 w-4" /> Generate research map
          </Link>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 mb-1">
            <div className="section-title mb-1.5">
              Suggested from your manuscript
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrefill(`${s.q}#${Date.now()}`)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    s.kind === "gap"
                      ? "border-uni/50 bg-uni-soft text-uni hover:bg-uni hover:text-white"
                      : "border-line bg-paper text-inkmut hover:border-brand hover:text-brand-deep"
                  }`}
                  title={s.q}
                >
                  {s.kind === "gap" ? (
                    <Lightbulb className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Suspense fallback={<Spinner />}>
            <LiteratureSearch
              manuscriptId={ms.id}
              prefill={prefill}
              placeholder="e.g. baselines for open-domain question answering…"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
