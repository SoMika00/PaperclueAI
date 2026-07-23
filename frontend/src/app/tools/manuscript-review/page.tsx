"use client";
import GlobalShell from "@/components/GlobalShell";
import { QuickToolPage } from "@/components/QuickToolPage";
import { BulletList, LabeledRow, ScoreBar } from "@/components/ResultParts";
import type { ManuscriptResponse } from "@/lib/edge-functions";
import { splitIntoSections } from "@/lib/sections";
import { useLocale } from "@/lib/i18n";

const ORANGE = "#E0951A";

export default function ManuscriptReviewPage() {
  const { t } = useLocale();
  const renderResult = (data: Record<string, unknown>) => {
    const res = data as ManuscriptResponse;
    const scores = res.readiness_score;
    if (!scores && !res.reviewer_concerns) return null;
    const gap = res.research_gap_analysis;
    return (
      <div>
        {scores?.publication_readiness && typeof scores.publication_readiness.score === "number" && (
          <ScoreBar label={t("review_pub_readiness")} score={scores.publication_readiness.score} justification={scores.publication_readiness.justification} />
        )}
        {scores?.submission_readiness && typeof scores.submission_readiness.score === "number" && (
          <ScoreBar label={t("review_sub_readiness")} score={scores.submission_readiness.score} justification={scores.submission_readiness.justification} />
        )}
        {res.reviewer_concerns && res.reviewer_concerns.length > 0 && (
          <LabeledRow label={t("review_concerns")} color={ORANGE}><BulletList items={res.reviewer_concerns} /></LabeledRow>
        )}
        {gap?.paragraphs_support_research_question && (
          <LabeledRow label={t("review_question")} color={ORANGE}>{gap.paragraphs_support_research_question}</LabeledRow>
        )}
        {gap?.discussion_answers_objectives && (
          <LabeledRow label={t("review_discussion")} color={ORANGE}>{gap.discussion_answers_objectives}</LabeledRow>
        )}
        {gap?.conclusions_supported_by_findings && (
          <LabeledRow label={t("review_conclusions")} color={ORANGE}>{gap.conclusions_supported_by_findings}</LabeledRow>
        )}
        {gap?.citation_flags && gap.citation_flags.length > 0 && (
          <LabeledRow label={t("review_citations")} color={ORANGE}><BulletList items={gap.citation_flags} /></LabeledRow>
        )}
        {res.overlap_flags && (
          <LabeledRow label={t("review_overlap")} color={ORANGE}>
            {res.overlap_flags.overlap_detected
              ? `${t("review_overlap_detected")} — ${res.overlap_flags.notes ?? ""}`
              : res.overlap_flags.notes ?? t("review_overlap_none")}
          </LabeledRow>
        )}
      </div>
    );
  };

  return (
    <GlobalShell>
      <QuickToolPage
        titleKey="tool_review_title"
        taglineKey="tool_review_tagline"
        edgeFunction="manuscript-ingestion"
        requiresDocument
        accent="#FF8A3D"
        chipKeys={["tool_review_chip1", "tool_review_chip2"]}
        buildBody={(prompt, doc) => {
          const sections = splitIntoSections(doc!.text, doc!.filename);
          return {
            sections: prompt.trim() ? { ...sections, review_focus: prompt } : sections,
            filename: doc!.filename,
          };
        }}
        renderResult={renderResult}
      />
    </GlobalShell>
  );
}
