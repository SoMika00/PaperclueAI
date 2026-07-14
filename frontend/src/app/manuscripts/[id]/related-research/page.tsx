"use client";
/* Related Research: the manuscript-scoped literature search. Findings feed the
   Evidence Ledger of this manuscript. */
import { Suspense, useEffect } from "react";
import LiteratureSearch from "@/components/LiteratureSearch";
import { Spinner } from "@/components/ui";
import { useWorkspace } from "@/lib/ws";

export default function RelatedResearchPage() {
  const { ms, refreshEvidence } = useWorkspace();

  // Browse writes evidence server-side; refresh when leaving searches behind.
  useEffect(() => {
    const t = setInterval(refreshEvidence, 8000);
    return () => clearInterval(t);
  }, [refreshEvidence]);

  const suggested = (ms.insight as any)?.keywords?.slice(0, 4).join(", ");

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-xl font-semibold">Related Research</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-5">
          Search literature connected to this manuscript — results are linked into
          its Evidence Ledger.
          {suggested && (
            <span className="block text-xs mt-1">
              From your paper&apos;s concepts: <em>{suggested}</em>
            </span>
          )}
        </p>
        <Suspense fallback={<Spinner />}>
          <LiteratureSearch
            manuscriptId={ms.id}
            placeholder="e.g. baselines for open-domain question answering…"
          />
        </Suspense>
      </div>
    </div>
  );
}
