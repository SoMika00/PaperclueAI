"use client";
import GlobalShell from "@/components/GlobalShell";
import { QuickToolPage } from "@/components/QuickToolPage";
import { BulletList, LabeledRow, scoreColor } from "@/components/ResultParts";
import type { JournalMatchResponse } from "@/lib/edge-functions";
import { splitIntoSections } from "@/lib/sections";
import { useLocale } from "@/lib/i18n";

const TEAL = "#0F9B8E";

export default function JournalMatchPage() {
  const { t } = useLocale();
  const renderResult = (data: Record<string, unknown>) => {
    const res = data as JournalMatchResponse;
    if (res.status && !res.top_match) {
      return <p className="text-[13.5px] text-inkmut dark:text-dark-inkmut leading-relaxed py-2">{res.status}</p>;
    }
    if (!res.top_match) return null;
    return (
      <div>
        <div className="flex items-center gap-3 py-3 border-b border-line dark:border-dark-line">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold tracking-[1px] text-inkmut dark:text-dark-inkmut mb-0.5 uppercase">
              {t("journal_best_fit")}
            </div>
            <div className="text-[16px] font-bold text-ink dark:text-dark-ink">{res.top_match}</div>
          </div>
          {typeof res.fit_score === "number" && (
            <span className="text-[15px] font-bold whitespace-nowrap rounded-full px-3.5 py-1.5" style={{ color: scoreColor(res.fit_score), background: "#E0F7F4" }}>
              {t("journal_fit")} {res.fit_score}/10
            </span>
          )}
        </div>
        {res.scope_alignment && (
          <LabeledRow label={t("journal_scope")} color={TEAL}>{res.scope_alignment}</LabeledRow>
        )}
        {res.justification && (
          <LabeledRow label={t("journal_why")} color={TEAL}>{res.justification}</LabeledRow>
        )}
        {res.alternatives && res.alternatives.length > 0 && (
          <LabeledRow label={t("journal_alternatives")} color={TEAL}>
            <BulletList items={res.alternatives} />
          </LabeledRow>
        )}
        <p className="text-[11.5px] text-inkmut dark:text-dark-inkmut pt-3">{t("journal_disclaimer")}</p>
      </div>
    );
  };

  return (
    <GlobalShell>
      <QuickToolPage
        titleKey="tool_journal_title"
        taglineKey="tool_journal_tagline"
        edgeFunction="journal-formatting"
        requiresDocument
        accent="#0F9B8E"
        chipKeys={["tool_journal_chip1", "tool_journal_chip2"]}
        buildBody={(prompt, doc) => {
          const sections = splitIntoSections(doc!.text, doc!.filename);
          return {
            title: sections.title ?? doc!.filename,
            abstract: (sections.abstract ?? doc!.text.slice(0, 2000)).slice(0, 4000),
            keywords: prompt.split(/[,;]/).map((k) => k.trim()).filter(Boolean).slice(0, 10),
          };
        }}
        renderResult={renderResult}
      />
    </GlobalShell>
  );
}
