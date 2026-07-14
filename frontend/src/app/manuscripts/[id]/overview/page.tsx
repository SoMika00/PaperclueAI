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
  Network,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Version } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { ReadinessGauge } from "@/components/ui";

const WEIGHT: Record<string, number> = { citations: 30, review: 40, insight: 15, base: 15 };
const LABEL: Record<string, string> = {
  citations: "Citation integrity",
  review: "Review findings addressed",
  insight: "Understanding coverage",
  base: "Document processed",
};

export default function OverviewPage() {
  const { ms } = useWorkspace();
  const [versions, setVersions] = useState<Version[]>([]);
  useEffect(() => {
    api<Version[]>(`/manuscripts/${ms.id}/versions`).then(setVersions).catch(() => {});
  }, [ms.id, ms.readiness]);

  const d: any = ms.readiness_detail || {};

  const features = [
    {
      seg: "insight",
      icon: Sparkles,
      label: "Paper Insight",
      status: ms.has_insight ? "Complete — anchored brief ready" : "Not run yet",
      done: ms.has_insight,
    },
    {
      seg: "review",
      icon: ClipboardCheck,
      label: "Review",
      status:
        d.open_issues != null
          ? `${d.open_issues} open issue${d.open_issues !== 1 ? "s" : ""}`
          : "Not run yet",
      done: d.open_issues === 0,
    },
    {
      seg: "review?tab=citations",
      icon: ClipboardCheck,
      label: "Citations",
      status: d.refs_total
        ? `${d.refs_verified}/${d.refs_total} verified against the public corpus`
        : "No references extracted",
      done: d.refs_total > 0 && d.refs_verified === d.refs_total,
    },
    {
      seg: "related-research",
      icon: FileSearch,
      label: "Related Research",
      status: "Search literature connected to this manuscript",
      done: false,
    },
    {
      seg: "mind-map",
      icon: Network,
      label: "Mind Map",
      status: "Position this manuscript in the research landscape",
      done: false,
    },
    {
      seg: "journal",
      icon: FileOutput,
      label: "Journal Format",
      status: "Check compliance and export",
      done: false,
    },
  ];

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
        <section className="flex items-center gap-8">
          <ReadinessGauge value={ms.readiness} size={96} />
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold">Submission readiness</h1>
            <p className="text-sm text-inkmut mt-0.5 mb-3">
              How the score is built — each component is inspectable. These are
              automated indicators of submission preparation, not a judgment of
              the work&apos;s scientific quality.
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(WEIGHT).map(([k, w]) => {
                const v = Number(d[k] ?? 0);
                return (
                  <div key={k} className="flex items-center gap-3 text-xs">
                    <span className="w-44 text-inkmut">{LABEL[k]}</span>
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
          <h2 className="section-title mb-2">Where you stand</h2>
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
                  <span className="text-xs text-brand-deep">Open →</span>
                </Link>
              );
            })}
          </div>
        </section>

        {versions.length > 0 && (
          <section>
            <h2 className="section-title mb-2">Version history</h2>
            <div className="card divide-y divide-line/70">
              {versions.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <History className="h-3.5 w-3.5 text-inkmut" />
                  <span className="font-medium">v{v.number}</span>
                  <span className="text-inkmut truncate flex-1">{v.label}</span>
                  <span className="badge badge-manuscript">readiness {v.readiness}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/manuscripts/${ms.id}/versions`}
              className="text-xs text-brand-deep mt-1.5 inline-block"
            >
              All versions →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
