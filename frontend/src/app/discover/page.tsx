"use client";
import { Suspense } from "react";
import GlobalShell from "@/components/GlobalShell";
import LiteratureSearch from "@/components/LiteratureSearch";
import { Spinner } from "@/components/ui";

export default function LiteraturePage() {
  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">Discover research</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">
          Search the public literature, your university corpus and your own documents.
        </p>
        <Suspense fallback={<Spinner />}>
          <LiteratureSearch />
        </Suspense>
      </div>
    </GlobalShell>
  );
}
