"use client";
/* Left panel only — the shared PDF canvas is mounted by the layout and
   survives navigation between chat/insight/review/journal. */
import FormatPanel from "@/components/panels/FormatPanel";

export default function JournalPage() {
  return (
    <section className="w-[330px] shrink-0 border-r border-line dark:border-dark-line bg-paper dark:bg-dark-surface overflow-y-auto panel-scroll">
      <FormatPanel />
    </section>
  );
}
