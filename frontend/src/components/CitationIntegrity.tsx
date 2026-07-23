"use client";
/* Prominent citation-integrity signal for the manuscript Overview. Fetches the
   references and highlights the trust-critical count: how many are unresolvable
   (possibly fabricated) or metadata-mismatched. One click into the Review
   citations view runs/inspects verification. Frontend-only — reuses the
   existing /manuscripts/{id}/references + /verify flow. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { api } from "@/lib/api";
import type { Reference } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export function CitationIntegrity({ msId }: { msId: string }) {
  const { t } = useLocale();
  const [refs, setRefs] = useState<Reference[] | null>(null);

  useEffect(() => {
    api<Reference[]>(`/manuscripts/${msId}/references`)
      .then(setRefs)
      .catch(() => setRefs([]));
  }, [msId]);

  if (!refs || refs.length === 0) return null;

  const total = refs.length;
  const verified = refs.filter((r) => r.status === "verified").length;
  const notFound = refs.filter((r) => r.status === "not_found").length;
  const suspect = refs.filter((r) => r.status === "suspect").length;
  const flagged = notFound + suspect;
  const unchecked = refs.filter((r) => r.status === "unverified").length;

  // Tone: red if anything unresolvable, amber if only mismatches, green if all
  // checked & clean, neutral if not yet verified.
  const state =
    notFound > 0 ? "danger" : suspect > 0 ? "warn" : unchecked === total ? "neutral" : "ok";

  const cfg = {
    danger: { Icon: ShieldAlert, color: "#E5484D", bg: "bg-danger/10", border: "border-danger/30" },
    warn: { Icon: ShieldAlert, color: "#E0951A", bg: "bg-uni-soft", border: "border-uni/40" },
    ok: { Icon: ShieldCheck, color: "#0F9B8E", bg: "bg-manuscript-soft", border: "border-manuscript/40" },
    neutral: { Icon: ShieldQuestion, color: "#5B6B8C", bg: "bg-surface2", border: "border-line" },
  }[state];
  const { Icon } = cfg;

  const headline =
    state === "danger"
      ? `${notFound} ${t("cite_unresolvable")}`
      : state === "warn"
      ? `${suspect} ${t("cite_mismatch")}`
      : state === "ok"
      ? t("cite_all_clean")
      : t("cite_not_checked");

  return (
    <section>
      <h2 className="section-title mb-2">{t("cite_integrity_title")}</h2>
      <div className={`rounded-lg border ${cfg.border} ${cfg.bg} dark:bg-dark-surface2 dark:border-dark-line px-4 py-3.5`}>
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 shrink-0" style={{ color: cfg.color }} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-ink dark:text-dark-ink">{headline}</div>
            <div className="text-xs text-inkmut dark:text-dark-inkmut mt-0.5">
              {verified}/{total} {t("cite_verified_of")}
              {flagged > 0 && ` · ${flagged} ${t("cite_flagged")}`}
              {unchecked > 0 && unchecked !== total && ` · ${unchecked} ${t("cite_unchecked")}`}
            </div>
          </div>
          <Link
            href={`/manuscripts/${msId}/review?tab=citations`}
            className="btn btn-primary shrink-0 text-[13px]"
          >
            {state === "neutral" ? t("cite_run_check") : t("cite_review_flagged")}
          </Link>
        </div>
      </div>
    </section>
  );
}
