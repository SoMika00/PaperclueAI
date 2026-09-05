"use client";
/* Left panel only — the shared PDF canvas is mounted by the layout and
   survives navigation between chat/insight/review/journal.
   No Suspense here: InsightPanel never suspends (no lazy import, no use()),
   and wrapping a plain effect-using client component in an unneeded Suspense
   boundary is a known source of "effect cleanup isn't a function" crashes
   in React 18 when the boundary re-renders around it. */
import InsightPanel from "@/components/panels/InsightPanel";

export default function InsightPage() {
  return (
    <section className="w-[330px] shrink-0 border-r border-line dark:border-dark-line bg-paper dark:bg-dark-surface overflow-y-auto panel-scroll">
      <InsightPanel />
    </section>
  );
}
