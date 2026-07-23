"use client";
/* Left panel only — the shared PDF canvas is mounted by the layout and
   survives navigation between chat/insight/review/journal. */
import { Suspense } from "react";
import DocumentChatPanel from "@/components/DocumentChatPanel";
import { Spinner } from "@/components/ui";

export default function DocumentChatPage() {
  return (
    <section className="w-[390px] shrink-0 border-r border-line dark:border-dark-line">
      <Suspense fallback={<Spinner className="h-5 w-5 m-4 text-brand" />}>
        <DocumentChatPanel />
      </Suspense>
    </section>
  );
}
