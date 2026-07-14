"use client";
import dynamic from "next/dynamic";
import InsightPanel from "@/components/panels/InsightPanel";
import { Spinner } from "@/components/ui";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 p-8 text-inkmut">
      <Spinner /> Loading PDF viewer…
    </div>
  ),
});

export default function InsightPage() {
  return (
    <div className="h-full flex">
      <section className="w-[330px] shrink-0 border-r border-line bg-paper overflow-y-auto panel-scroll">
        <InsightPanel />
      </section>
      <section className="flex-1 min-w-0">
        <PdfViewer />
      </section>
    </div>
  );
}
