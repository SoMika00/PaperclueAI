"use client";

import dynamic from "next/dynamic";
import DocumentChatPanel from "@/components/DocumentChatPanel";
import { Spinner } from "@/components/ui";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => <div className="p-8 text-inkmut flex gap-2"><Spinner /> Loading PDF…</div>,
});

export default function DocumentChatPage() {
  return (
    <div className="h-full flex">
      <section className="w-[390px] shrink-0 border-r border-line dark:border-dark-line">
        <DocumentChatPanel />
      </section>
      <section className="flex-1 min-w-0"><PdfViewer /></section>
    </div>
  );
}
