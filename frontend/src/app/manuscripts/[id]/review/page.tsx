"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import ReviewPanel from "@/components/panels/ReviewPanel";
import { Spinner } from "@/components/ui";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 p-8 text-inkmut">
      <Spinner /> Loading PDF viewer…
    </div>
  ),
});

export default function ReviewPage() {
  return (
    <div className="h-full flex">
      <section className="w-[340px] shrink-0 border-r border-line bg-paper overflow-y-auto panel-scroll">
        <Suspense fallback={<Spinner className="h-5 w-5 m-4 text-brand" />}>
          <ReviewPanel />
        </Suspense>
      </section>
      <section className="flex-1 min-w-0">
        <PdfViewer />
      </section>
    </div>
  );
}
