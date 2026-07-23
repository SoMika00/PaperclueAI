"use client";
/* Left panel only — the shared PDF canvas is mounted by the layout and
   survives navigation between chat/insight/review/journal. */
import { Suspense } from "react";
import InsightPanel from "@/components/panels/InsightPanel";
import { Spinner } from "@/components/ui";

export default function InsightPage() {
  return (
    <section className="w-[330px] shrink-0 border-r border-line dark:border-dark-line bg-paper dark:bg-dark-surface overflow-y-auto panel-scroll">
      <Suspense fallback={<Spinner className="h-5 w-5 m-4 text-brand" />}>
        <InsightPanel />
      </Suspense>
    </section>
  );
}
