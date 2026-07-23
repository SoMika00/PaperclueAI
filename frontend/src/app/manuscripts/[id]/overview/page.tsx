"use client";
/* Overview: where the manuscript stands — explicable readiness, feature status,
   next actions. */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  FileOutput,
  FileSearch,
  History,
  MessageSquare,
  Network,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Version } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { ReadinessGauge } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

const WEIGHT: Record<string, number> = { citations: 30, review: 40, insight: 15, base: 15 };
const LABEL_KEY: Record<string, string> = {
  citations: "score_citation_integrity",
  review: "score_review_findings",
  insight: "score_understanding",
  base: "score_document_processed",
};

export default function OverviewPage() {
  const { t } = useLocale();
  const { ms } = useWorkspace();
  const [versions, setVersions] = useState<Version[]>([]);
  useEffect(() => {
    api<Version[]>(`/manuscripts/${ms.id}/versions`).then(setVersions).catch(() => {});
  }, [ms.id, ms.readiness]);

  const d: any = ms.readiness_detail || {};

  const features = [
    {
      seg: "chat",
      icon: MessageSquare,
      label: "Chat",
      status: t("chat_feature_status" as any),
      done: false,
    },
    {
      seg: "insight",
      icon: Sparkles,
      label: t("feat_paper_insight"),
      status: ms.has_insight ? t("feat_insight_complete") : t("feat_not_run_yet"),
      done: ms.has_insight,
    },
    {
      seg: "review",
      icon: ClipboardCheck,
      label: t("feat_review"),
      status:
        d.open_issues != null
          ? `${d.open_issues} ${d.open_issues !== 1 ? t("feat_open_issues_p") : t("feat_open_issue_s")}`
          : t("feat_not_run_yet"),
      done: d.open_issues === 0,
    },
    {
      seg: "review?tab=citations",
      icon: ClipboardCheck,
      label: t("feat_citations"),
      status: d.refs_total
        ? `${d.refs_verified}/${d.refs_total} ${t("feat_verified_against")}`
        : t("feat_no_refs_extracted"),
      done: d.refs_total > 0 && d.refs_verified === d.refs_total,
    },
    {
      seg: "related-research",
      icon: FileSearch,
      label: t("feat_related_research"),
      status: t("feat_related_status"),
      done: false,
    },
    {
      seg: "mind-map",
      icon: Network,
      label: t("feat_mind_map"),
      status: t("feat_mind_map_status"),
      done: false,
    },
    {
      seg: "journal",
      icon: FileOutput,
      label: t("feat_journal_format"),
      status: t("feat_journal_status"),
      done: false,
    },
  ];

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
        <section className="flex items-center gap-8">
          <ReadinessGauge value={ms.readiness} size={96} />
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold">{t("submission_readiness_title")}</h1>
            <p className="text-sm text-inkmut mt-0.5 mb-3">
              {t("readiness_full_explainer")}
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(WEIGHT).map(([k, w]) => {
                const v = Number(d[k] ?? 0);
                return (
                  <div key={k} className="flex items-center gap-3 text-xs">
                    <span className="w-44 text-inkmut">{t(LABEL_KEY[k] as any)}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-700"
                        style={{ width: `${(v / w) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-medium">
                      {Math.round(v)}/{w}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title mb-2">{t("where_you_stand")}</h2>
          <div className="card divide-y divide-line/70">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link
                  key={i}
                  href={`/manuscripts/${ms.id}/${f.seg}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface2/50 transition-colors"
                >
                  <Icon className={`h-4 w-4 ${f.done ? "text-manuscript" : "text-inkmut"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-inkmut">{f.status}</div>
                  </div>
                  <span className="text-xs text-brand-deep">{t("open_arrow")}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {versions.length > 0 && (
          <section>
            <h2 className="section-title mb-2">{t("version_history")}</h2>
            <div className="card divide-y divide-line/70">
              {versions.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <History className="h-3.5 w-3.5 text-inkmut" />
                  <span className="font-medium">v{v.number}</span>
                  <span className="text-inkmut truncate flex-1">{v.label}</span>
                  <span className="badge badge-manuscript">{t("readiness_badge")} {v.readiness}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/manuscripts/${ms.id}/versions`}
              className="text-xs text-brand-deep mt-1.5 inline-block"
            >
              {t("all_versions_arrow")}
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
