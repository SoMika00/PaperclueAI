"use client";
import { Logo } from "@/components/Logo";
/* The visible ingestion pipeline — the system shows it understands your paper. */
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { Manuscript } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

const STEPS: { key: string; labelKey: string; subKey: string }[] = [
  {
    key: "parsing",
    labelKey: "ingest_parsing_label",
    subKey: "ingest_parsing_sub",
  },
  {
    key: "references",
    labelKey: "ingest_references_label",
    subKey: "ingest_references_sub",
  },
  {
    key: "metadata",
    labelKey: "ingest_metadata_label",
    subKey: "ingest_metadata_sub",
  },
  {
    key: "indexing",
    labelKey: "ingest_indexing_label",
    subKey: "ingest_indexing_sub",
  },
];

export default function IngestStepper({ ms }: { ms: Manuscript }) {
  const { t } = useLocale();
  const steps = ms.ingest_steps || {};
  const failed = ms.status === "error";
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="card p-8 w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-1">
          <Logo className="h-5" />
          <span className="font-serif text-lg font-semibold">{t("ingest_title")}</span>
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
                    {t(s.labelKey as any)}
                  </div>
                  <div className="text-xs text-inkmut">{t(s.subKey as any)}</div>
                </div>
              </li>
            );
          })}
        </ol>
        {failed && (
          <div className="mt-6 text-sm text-danger">
            {t("ingest_failed")}{steps.error ? ` — ${steps.error}` : ""}. {t("ingest_retry")}
          </div>
        )}
      </div>
    </div>
  );
}
