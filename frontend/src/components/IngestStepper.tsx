"use client";
/* The visible ingestion pipeline — the system shows it understands your paper. */
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { Manuscript } from "@/lib/types";

const STEPS: { key: string; label: string; sub: string }[] = [
  {
    key: "parsing",
    label: "Extracting text",
    sub: "Reading pages, detecting Abstract, Methods, Results…",
  },
  {
    key: "references",
    label: "Extracting references",
    sub: "Reading the bibliography into resolvable citation objects",
  },
  {
    key: "metadata",
    label: "Understanding the paper",
    sub: "Title, authors, field of study, language",
  },
  {
    key: "indexing",
    label: "Indexing for semantic search",
    sub: "Runs in the background — the workspace opens before this finishes",
  },
];

export default function IngestStepper({ ms }: { ms: Manuscript }) {
  const steps = ms.ingest_steps || {};
  const failed = ms.status === "error";
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="card p-8 w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-1">
          <img src="/paperclue/paperclue-logo.png" alt="PaperClue" className="h-5 w-auto" />
          <span className="font-serif text-lg font-semibold">Ingesting your manuscript</span>
        </div>
        <p className="text-sm text-inkmut mb-6 truncate">{ms.title}</p>
        <ol className="flex flex-col gap-5">
          {STEPS.map((s) => {
            const state = steps[s.key] || "pending";
            return (
              <li key={s.key} className="flex gap-3">
                <span className="mt-0.5">
                  {state === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-manuscript" />
                  ) : state === "running" ? (
                    <Loader2 className="h-5 w-5 text-brand-deep animate-spin" />
                  ) : failed ? (
                    <XCircle className="h-5 w-5 text-danger/60" />
                  ) : (
                    <Circle className="h-5 w-5 text-ink/15" />
                  )}
                </span>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      state === "pending" ? "text-inkmut" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-xs text-inkmut">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>
        {failed && (
          <div className="mt-6 text-sm text-danger">
            Ingestion failed{steps.error ? ` — ${steps.error}` : ""}. Try re-uploading the
            PDF.
          </div>
        )}
      </div>
    </div>
  );
}
