"use client";
import GlobalShell from "@/components/GlobalShell";
import { QuickToolPage } from "@/components/QuickToolPage";
import { ScoreBar, scoreColor } from "@/components/ResultParts";
import type { PaperInsightsResponse, ScoreWithJustification } from "@/lib/edge-functions";
import { useLocale } from "@/lib/i18n";

const DIMENSION_KEYS: Record<string, string> = {
  novelty: "dim_novelty",
  methodology: "dim_methodology",
  statistical_soundness: "dim_statistical",
  literature_coverage: "dim_literature",
  writing_quality: "dim_writing",
  reproducibility: "dim_reproducibility",
  practical_impact: "dim_impact",
};

export default function PaperInsightsPage() {
  const { t } = useLocale();
  const renderResult = (data: Record<string, unknown>) => {
    const res = data as PaperInsightsResponse;
    if (!res.scores) return null;
    const entries = Object.entries(res.scores).filter(
      (e): e is [string, ScoreWithJustification] => typeof e[1]?.score === "number"
    );
    if (entries.length === 0) return null;
    const avg = entries.reduce((s, [, v]) => s + v.score, 0) / entries.length;
    const rounded = Math.round(avg * 10) / 10;
    return (
      <div>
        <div className="flex items-center gap-3 py-3 border-b border-line dark:border-dark-line">
          <span className="text-[26px] font-bold" style={{ color: scoreColor(rounded) }}>{rounded}/10</span>
          <span className="text-[13px] text-inkmut dark:text-dark-inkmut leading-snug">
            {t("insights_overall")} · {entries.length} {t("insights_dimensions")}
          </span>
        </div>
        {res.overall_summary && (
          <p className="text-[13.5px] text-ink/85 dark:text-dark-ink leading-relaxed py-3 border-b border-line dark:border-dark-line">
            {res.overall_summary}
          </p>
        )}
        {entries.map(([key, value]) => (
          <ScoreBar
            key={key}
            label={DIMENSION_KEYS[key] ? t(DIMENSION_KEYS[key] as Parameters<typeof t>[0]) : key.replace(/_/g, " ")}
            score={value.score}
            justification={value.justification}
          />
        ))}
      </div>
    );
  };

  return (
    <GlobalShell>
      <QuickToolPage
        titleKey="tool_insights_title"
        taglineKey="tool_insights_tagline"
        edgeFunction="paper-insights"
        requiresDocument
        accent="#FF5A7A"
        chipKeys={["tool_insights_chip1", "tool_insights_chip2"]}
        buildBody={(_prompt, doc) => ({
          document_text: doc!.text.slice(0, 120000),
          filename: doc!.filename,
        })}
        renderResult={renderResult}
      />
    </GlobalShell>
  );
}
