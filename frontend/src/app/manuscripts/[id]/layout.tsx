"use client";
/* Manuscript Space: the SAME left menu as everywhere (global items constant,
   manuscript features as the Focus submenu) + compact document header.
   Evidence Ledger stays a drawer. */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, MessageSquare, Play, ScrollText, Share2 } from "lucide-react";
import { api, downloadFile } from "@/lib/api";
import type { Manuscript, Version } from "@/lib/types";
import { WorkspaceProvider, useWorkspace } from "@/lib/ws";
import EvidenceDrawer from "@/components/EvidenceDrawer";
import IngestStepper from "@/components/IngestStepper";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ReadinessGauge, Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

const SCORE_PARTS: { key: string; labelKey: string; max: number; doneKey?: string }[] = [
  { key: "base", labelKey: "score_document_processed", max: 15 },
  { key: "insight", labelKey: "score_understanding", max: 15, doneKey: "insight_done" },
  { key: "citations", labelKey: "score_citation_integrity", max: 30, doneKey: "citations_checked" },
  { key: "review", labelKey: "score_review_findings", max: 40, doneKey: "review_done" },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

function ScorePopover({ ms }: { ms: Manuscript }) {
  const { t } = useLocale();
  const d: any = ms.readiness_detail || {};
  return (
    <div className="absolute right-0 top-12 z-50 card p-4 w-72 shadow-drawer">
      <div className="font-semibold text-sm mb-1">
        {t("submission_readiness_score")} — {ms.readiness}/100
      </div>
      <p className="text-[11px] text-inkmut mb-2.5">
        {t("readiness_explainer")}
      </p>
      <div className="flex flex-col gap-1.5">
        {SCORE_PARTS.map((p) => {
          const v = Number(d[p.key] ?? 0);
          const notDone = p.doneKey && !d[p.doneKey];
          return (
            <div key={p.key} className="flex items-center gap-2 text-[11px]">
              <span className="w-36 text-inkmut">{t(p.labelKey as any)}</span>
              <span className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${(v / p.max) * 100}%` }}
                />
              </span>
              <span className="w-16 text-right font-medium">
                {notDone ? t("not_run") : `${Math.round(v)}/${p.max}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { ms, refreshMs, evidence, drawerOpen, setDrawerOpen, readinessDelta } =
    useWorkspace();
  const router = useRouter();
  const { t } = useLocale();
  const [versions, setVersions] = useState<Version[]>([]);
  const [shared, setShared] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    api<Version[]>(`/manuscripts/${ms.id}/versions`).then(setVersions).catch(() => {});
  }, [ms.id, ms.readiness]);

  // Keep polling lightly while the semantic index builds in the background.
  useEffect(() => {
    if (ms.index_status !== "indexing") return;
    const t = setInterval(refreshMs, 4000);
    return () => clearInterval(t);
  }, [ms.index_status, refreshMs]);

  const d: any = ms.readiness_detail || {};
  const statusBits = [
    ms.has_insight ? t("insight_complete") : null,
    d.review_done ? `${d.open_issues} ${d.open_issues !== 1 ? t("open_issue_plural") : t("open_issue_singular")}` : null,
    d.citations_checked ? `${d.refs_verified}/${d.refs_total} ${t("references_verified_label")}` : null,
  ].filter(Boolean);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
      <Sidebar focus={{ msId: ms.id, title: ms.title }} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="border-b border-line dark:border-dark-line bg-paper dark:bg-dark-surface px-4 py-2 shrink-0 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-serif font-semibold truncate leading-tight text-[15px]">
              {ms.title}
            </div>
            <div className="text-[11px] text-inkmut dark:text-dark-inkmut truncate">
              {(ms.origin as any)?.kind === "revision_copy" ? "Revision Copy · source preserved" : t("private_manuscript")} · {t("version_label")} {versions[0]?.number ?? 1} · {t("saved_label")}{" "}
              {timeAgo(ms.updated_at)}
              {(ms.origin as any)?.working_copy_of && (
                <Link href={`/manuscripts/${(ms.origin as any).working_copy_of}/overview`}
                  className="ml-2 text-brand-deep hover:underline">
                  View source
                </Link>
              )}
              {ms.index_status === "indexing" && (
                <span className="ml-2 inline-flex items-center gap-1 text-brand-deep">
                  <Spinner className="h-2.5 w-2.5" /> {t("indexing_semantic")}
                </span>
              )}
              {statusBits.length > 0 && (
                <>
                  <span className="mx-1.5 text-line">|</span>
                  {statusBits.join(" · ")}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 relative">
            <button onClick={() => router.push(`/manuscripts/${ms.id}/chat`)} className="btn btn-outline">
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setShared(true);
                setTimeout(() => setShared(false), 1500);
              }}
              className="btn btn-ghost"
            >
              <Share2 className="h-3.5 w-3.5" /> {shared ? t("copied_label") : t("share_label")}
            </button>
            <button
              onClick={() => downloadFile(`/format/${ms.id}/export?journal=scientific-reports`)}
              className="btn btn-ghost">
              <Download className="h-3.5 w-3.5" /> {t("export_label")}
            </button>
            <button
              onClick={() => router.push(`/manuscripts/${ms.id}/review?run=1`)}
              className="btn btn-primary"
            >
              <Play className="h-3.5 w-3.5" /> {t("run_review_button")}
            </button>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`btn ${drawerOpen ? "btn-primary" : "btn-outline"}`}
              title="Evidence Ledger"
            >
              <ScrollText className="h-3.5 w-3.5" /> {t("evidence_label")} {evidence.length}
            </button>
            <button
              onClick={() => setShowScore(!showScore)}
              title="How this score is built"
              className="rounded-full hover:ring-2 hover:ring-brand/40 transition-shadow"
            >
              <ReadinessGauge value={ms.readiness} delta={readinessDelta} size={40} />
            </button>
            {showScore && <ScorePopover ms={ms} />}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {children}
          {drawerOpen && <EvidenceDrawer />}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function ManuscriptLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const [ms, setMs] = useState<Manuscript | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const m = await api<Manuscript>(`/manuscripts/${params.id}`);
        if (stop) return;
        setMs(m);
        if (m.status === "ingesting") timer = setTimeout(tick, 1200);
      } catch (e: any) {
        if (!stop) setError(e.message);
      }
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [params.id]);

  if (error)
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="card p-6 text-sm text-danger">
          Manuscript not found —{" "}
          <Link href="/home" className="text-brand underline">
            back to dashboard
          </Link>
        </div>
      </div>
    );
  if (!ms)
    return (
      <div className="min-h-screen grid place-items-center text-inkmut">
        <div className="flex items-center gap-2">
          <Spinner /> Opening workspace…
        </div>
      </div>
    );
  if (ms.status !== "ready") return <IngestStepper ms={ms} />;

  return (
    <WorkspaceProvider initial={ms}>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
