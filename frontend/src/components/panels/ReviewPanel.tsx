"use client";
/* Review v2: a workflow, not a wall. Severity groups -> compact list ->
   selected issue detail with Why it matters / Suggested action and
   Accept / Edit / Dismiss. Citations get their own sub-view. */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Pencil,
  Play,
  X,
} from "lucide-react";
import { api, pollTask } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import type { Issue, Reference } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { ConfidenceBar, Spinner, TaskProgress } from "../ui";

const SEV_ORDER = ["critical", "major", "minor"] as const;
const SEV_CLS: Record<string, string> = {
  critical: "bg-danger/10 text-danger border-danger/40",
  major: "bg-warn/10 text-warn border-warn/40",
  minor: "bg-surface2 text-inkmut border-line",
};

const REF_STATUS_KEY: Record<string, { labelKey: string; cls: string }> = {
  verified: { labelKey: "ref_verified", cls: "text-manuscript" },
  suspect: { labelKey: "ref_suspect", cls: "text-warn" },
  not_found: { labelKey: "ref_not_found", cls: "text-danger" },
  unverified: { labelKey: "ref_unchecked", cls: "text-inkmut" },
};

export default function ReviewPanel() {
  const { t } = useLocale();
  const { ms, requestHighlight, refreshEvidence, refreshMs, setDrawerOpen } =
    useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const autoran = useRef(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [task, setTask] = useState<{ step: string; progress: number } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"issues" | "citations">(
    params.get("tab") === "citations" ? "citations" : "issues"
  );
  const [sevFilter, setSevFilter] = useState<string | "resolved" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    const [i, r] = await Promise.all([
      api<Issue[]>(`/manuscripts/${ms.id}/issues`),
      api<Reference[]>(`/manuscripts/${ms.id}/references`),
    ]);
    setIssues(i);
    setRefs(r);
  }, [ms.id]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const runReview = useCallback(async () => {
    setError(null);
    setSelectedId(null);
    setTask({ step: t("starting_review"), progress: 3 });
    try {
      const { task_id } = await api<{ task_id: string }>(`/review/${ms.id}`, {
        method: "POST",
      });
      const taskRes = await pollTask(task_id, (u) =>
        setTask({ step: u.step, progress: u.progress })
      );
      if (taskRes.status === "error") setError(taskRes.error || t("review_failed"));
      await load();
      refreshEvidence();
      refreshMs();
    } catch (e: any) {
      setError(e.message?.slice(0, 200));
    } finally {
      setTask(null);
    }
  }, [ms.id, load, refreshEvidence, refreshMs]);

  // Header "Run review" deep-links here with ?run=1
  useEffect(() => {
    if (params.get("run") === "1" && !autoran.current) {
      autoran.current = true;
      runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = useCallback(async () => {
    setVerifying(true);
    setError(null);
    try {
      const { task_id } = await api<{ task_id: string }>(`/verify/${ms.id}`, {
        method: "POST",
      });
      const taskRes = await pollTask(task_id, undefined, 2500);
      if (taskRes.status === "error") setError(taskRes.error || t("verification_failed"));
      await load();
      refreshEvidence();
      refreshMs();
    } catch (e: any) {
      setError(e.message?.slice(0, 200));
    } finally {
      setVerifying(false);
    }
  }, [ms.id, load, refreshEvidence, refreshMs]);

  const act = useCallback(
    async (issue: Issue, action: "accept" | "reject", edit?: string) => {
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issue.id
            ? { ...i, status: action === "accept" ? "accepted" : "rejected" }
            : i
        )
      );
      setSelectedId(null);
      setEditing(false);
      try {
        const result = await api<{
          working_copy?: { id: string };
          applied?: boolean;
        }>(`/review-issues/${issue.id}`, {
          method: "PATCH",
          body: JSON.stringify({ action, edit: edit || null }),
        });
        if (action === "accept" && result.working_copy?.id && result.working_copy.id !== ms.id) {
          router.push(`/manuscripts/${result.working_copy.id}/review?copy=created`);
          return;
        }
        await load();
        refreshMs();
        refreshEvidence();
      } catch {
        await load();
      }
    },
    [load, refreshMs, refreshEvidence, ms.id, router]
  );

  const open = issues.filter((i) => i.status === "open");
  const resolved = issues.filter((i) => i.status !== "open");
  const bySev = (s: string) => open.filter((i) => i.severity === s);
  const selected = issues.find((i) => i.id === selectedId) || null;

  const listed =
    sevFilter === "resolved"
      ? resolved
      : sevFilter
        ? bySev(sevFilter)
        : open;

  /* ---------- selected issue detail ---------- */
  if (selected) {
    const done = selected.status !== "open";
    return (
      <div className="p-4 flex flex-col gap-3">
        <button
          onClick={() => {
            setSelectedId(null);
            setEditing(false);
          }}
          className="flex items-center gap-1 text-xs text-inkmut hover:text-ink self-start"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {t("all_issues_back")}
        </button>

        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`badge border ${SEV_CLS[selected.severity]}`}>
              {selected.severity}
            </span>
            <span className="badge badge-ai">{selected.category}</span>
            <span className="ml-auto">
              <ConfidenceBar value={selected.confidence} />
            </span>
          </div>
          <h3 className="font-serif font-semibold text-[15px] leading-snug mt-2">
            {selected.title}
          </h3>
          <div className="text-xs text-inkmut mt-1">
            {t("location_label")}: {selected.section || "—"} · {t("review_page")} {selected.page || "?"}
          </div>
        </div>

        <div>
          <div className="section-title">{t("why_it_matters")}</div>
          <p className="text-[13px] leading-snug mt-1">{selected.description}</p>
        </div>

        {selected.quote && (
          <button
            onClick={() => requestHighlight(selected.page, selected.quote, "review")}
            className="text-left rounded-lg bg-warn/5 border border-warn/30 px-3 py-2 text-xs italic text-ink hover:border-warn transition-colors"
          >
            “{selected.quote.slice(0, 180)}”
            <span className="not-italic text-warn block mt-0.5">{t("highlight_arrow_pdf")}</span>
          </button>
        )}

        <div>
          <div className="section-title">{t("suggested_action")}</div>
          {editing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full mt-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs outline-none focus:border-brand"
            />
          ) : (
            <p className="text-[13px] leading-snug mt-1 rounded-lg bg-manuscript-soft/60 border border-manuscript/30 px-3 py-2">
              {selected.suggestion}
            </p>
          )}
        </div>

        {selected.evidence_note && (
          <div className="text-[11px] text-inkmut flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> {selected.evidence_note}
          </div>
        )}

        {!done ? (
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              onClick={() => requestHighlight(selected.page, selected.quote, "review")}
              className="btn btn-outline text-xs"
            >
              <FileText className="h-3.5 w-3.5" /> {t("highlight_in_pdf")}
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn btn-outline text-xs"
            >
              {t("view_source")}
            </button>
            {editing ? (
              <button
                onClick={() => act(selected, "accept", editText)}
                className="btn btn-primary text-xs"
              >
                <Check className="h-3.5 w-3.5" /> {t("accept_edited_fix")}
              </button>
            ) : (
              <>
                <button
                  onClick={() => act(selected, "accept")}
                  className="btn btn-primary text-xs"
                >
                  <Check className="h-3.5 w-3.5" /> {t("accept_label")}
                </button>
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditText(selected.suggestion);
                  }}
                  className="btn btn-outline text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> {t("edit_label")}
                </button>
              </>
            )}
            <button
              onClick={() => act(selected, "reject")}
              className="btn btn-danger text-xs"
            >
              <X className="h-3.5 w-3.5" /> {t("dismiss_label")}
            </button>
          </div>
        ) : (
          <div className="text-xs font-medium text-inkmut">
            {selected.status === "accepted" ? t("fix_accepted") : t("dismissed_label")}
          </div>
        )}
      </div>
    );
  }

  /* ---------- list / workflow ---------- */
  return (
    <div className="p-4 flex flex-col gap-3">
      {params.get("copy") === "created" && (
        <div className="rounded-lg border border-manuscript/40 bg-manuscript-soft/60 px-3 py-2 text-xs text-manuscript">
          {t("review_copy_created")}
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-brand" />
          <h2 className="font-serif font-semibold">{t("review_title")}</h2>
        </div>
        <p className="text-[11px] text-inkmut mt-0.5">
          {t("review_subtitle")}
        </p>
      </div>

      {!task && (
        <button onClick={runReview} className="btn btn-primary self-start">
          <Play className="h-3.5 w-3.5" />
          {issues.length ? t("rerun_review") : t("run_peer_review")}
        </button>
      )}
      {task && <TaskProgress step={task.step} progress={task.progress} />}
      {error && <div className="text-xs text-danger">{error}</div>}

      <div className="flex gap-1 border-b border-line">
        {(["issues", "citations"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px capitalize transition-colors ${
              view === v
                ? "border-brand text-brand-deep"
                : "border-transparent text-inkmut hover:text-ink"
            }`}
          >
            {v === "citations" ? `${t("tab_citations_count")} (${refs.length})` : `${t("tab_issues_count")} (${open.length})`}
          </button>
        ))}
      </div>

      {view === "issues" && (
        <>
          {issues.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {SEV_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setSevFilter(sevFilter === s ? null : s)}
                  className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${
                    sevFilter === s ? "ring-2 ring-brand" : ""
                  } ${SEV_CLS[s]}`}
                >
                  <div className="text-base font-bold leading-none">{bySev(s).length}</div>
                  <div className="text-[10px] capitalize mt-0.5">{s}</div>
                </button>
              ))}
              <button
                onClick={() => setSevFilter(sevFilter === "resolved" ? null : "resolved")}
                className={`rounded-lg border border-manuscript/40 bg-manuscript-soft text-manuscript px-2 py-1.5 text-center transition-colors ${
                  sevFilter === "resolved" ? "ring-2 ring-brand" : ""
                }`}
              >
                <div className="text-base font-bold leading-none">{resolved.length}</div>
                <div className="text-[10px] mt-0.5">{t("resolved_label")}</div>
              </button>
            </div>
          )}

          <div className="flex flex-col divide-y divide-line/70">
            {listed.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                className="text-left py-2.5 hover:bg-surface2/60 -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`badge border ${SEV_CLS[i.severity]}`}>{i.severity}</span>
                  <span className="text-[10px] text-inkmut">{i.category}</span>
                  {i.page && (
                    <span className="text-[10px] text-inkmut ml-auto">p.{i.page}</span>
                  )}
                </div>
                <div className="text-[13px] font-medium leading-snug mt-1">{i.title}</div>
              </button>
            ))}
            {issues.length === 0 && !task && (
              <div className="text-xs text-inkmut py-6 text-center">
                {t("no_review_yet")}
              </div>
            )}
            {issues.length > 0 && listed.length === 0 && (
              <div className="text-xs text-inkmut py-4 text-center">
                {t("nothing_in_group")}
              </div>
            )}
          </div>
        </>
      )}

      {view === "citations" && (
        <div className="flex flex-col gap-2">
          <button onClick={verify} disabled={verifying} className="btn btn-outline self-start">
            {verifying ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <BadgeCheck className="h-3.5 w-3.5" />
            )}
            {t("verify_all_button")}
          </button>
          <p className="text-[10px] text-inkmut -mt-1">
            {t("verify_explainer")}
          </p>
          <div className="flex flex-col divide-y divide-line/70">
            {refs.map((r) => {
              const stKey = REF_STATUS_KEY[r.status] || REF_STATUS_KEY.unverified;
              return (
                <div key={r.id} className="py-2">
                  <div className="text-xs leading-snug">
                    {r.title || r.raw?.slice(0, 120)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                    <span className={`font-semibold ${stKey.cls}`}>{t(stKey.labelKey as any)}</span>
                    {r.year && <span className="text-inkmut">{r.year}</span>}
                    {r.resolved_meta?.url && (
                      <a
                        href={r.resolved_meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pub underline ml-auto"
                      >
                        {t("open_source_link")}
                      </a>
                    )}
                  </div>
                  {r.status === "suspect" && r.resolved_meta && (
                    <div className="text-[10px] text-warn mt-0.5">
                      {t("closest_match")} {r.resolved_meta.title?.slice(0, 90)} (
                      {r.resolved_meta.year})
                    </div>
                  )}
                </div>
              );
            })}
            {refs.length === 0 && (
              <div className="text-xs text-inkmut py-4 text-center">
                {t("no_refs_extracted_full")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
