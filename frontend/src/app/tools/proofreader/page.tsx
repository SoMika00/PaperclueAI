"use client";
import GlobalShell from "@/components/GlobalShell";
import { QuickToolPage } from "@/components/QuickToolPage";
import { BulletList, LabeledRow, StatTile, scoreColor } from "@/components/ResultParts";
import type { ProofreadingResponse } from "@/lib/edge-functions";
import { splitIntoSections } from "@/lib/sections";
import { useLocale } from "@/lib/i18n";

const AMBER = "#E0951A";

export default function ProofreaderPage() {
  const { t } = useLocale();
  const renderResult = (data: Record<string, unknown>) => {
    const res = data as ProofreadingResponse;
    const hasStats = typeof res.grammar_issues === "number" || typeof res.clarity_score === "number";
    if (!hasStats && !res.section_feedback) return null;
    return (
      <div>
        <div className="flex gap-3 py-3">
          {typeof res.grammar_issues === "number" && (
            <StatTile value={res.grammar_issues} label={t("proof_grammar_issues")} color={res.grammar_issues > 10 ? "#E5484D" : "#14213D"} />
          )}
          {typeof res.clarity_score === "number" && (
            <StatTile value={`${res.clarity_score}/10`} label={t("proof_clarity")} color={scoreColor(res.clarity_score)} />
          )}
          {res.passive_voice_ratio && <StatTile value={res.passive_voice_ratio} label={t("proof_passive")} />}
        </div>
        {res.missing_transitions && res.missing_transitions.length > 0 && (
          <LabeledRow label={t("proof_transitions")} color={AMBER}>
            <BulletList items={res.missing_transitions.map((x) => `${t("proof_missing")}: ${x}`)} />
          </LabeledRow>
        )}
        {res.section_feedback &&
          Object.entries(res.section_feedback).map(([section, note]) => (
            <LabeledRow key={section} label={section} color={AMBER}>
              {note}
            </LabeledRow>
          ))}
      </div>
    );
  };

  return (
    <GlobalShell>
      <QuickToolPage
        titleKey="tool_proof_title"
        taglineKey="tool_proof_tagline"
        edgeFunction="proofreading"
        requiresDocument
        accent="#E0951A"
        chipKeys={["tool_proof_chip1", "tool_proof_chip2"]}
        buildBody={(prompt, doc) => {
          const sections = splitIntoSections(doc!.text, doc!.filename);
          return {
            sections: prompt.trim() ? { ...sections, instructions: prompt } : sections,
            filename: doc!.filename,
          };
        }}
        renderResult={renderResult}
      />
    </GlobalShell>
  );
}
