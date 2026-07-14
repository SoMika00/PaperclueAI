"use client";
/* Review v2: a workflow, not a wall. Severity groups -> compact list ->
   selected issue detail with Why it matters / Suggested action and
   Accept / Edit / Dismiss. Citations get their own sub-view. */
import { useSearchParams } from "next/navigation";
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
import type { Issue, Reference } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { ConfidenceBar, Spinner, TaskProgress } from "../ui";

const SEV_ORDER = ["critical", "major", "minor"] as const;
const SEV_CLS: Record<string, string> = {
  critical: "bg-danger/10 text-danger border-danger/40",
  major: "bg-warn/10 text-warn border-warn/40",
  minor: "bg-surface2 text-inkmut border-line",
};

const REF_STATUS: Record<string, { label: string; cls: string }> = {
  verified: { label: "✓ verified", cls: "text-manuscript" },
  suspect: { label: "⚠ metadata mismatch", cls: "text-warn" },
  not_found: { label: "✗ not found", cls: "text-danger" },
  unverified: { label: "· unchecked", cls: "text-inkmut" },
};

export default function ReviewPanel() {
  const { ms, requestHighlight, refreshEvidence, refreshMs, setDrawerOpen } =
    useWorkspace();
  const params = useSearchParams();
  const autoran = useRef(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [task, setTask] = useState<{ step: string; progress: number } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"issues" | "citations">("issues");
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
    setTask({ step: "Starting review…", progress: 3 });
    try {
      const { task_id } = await api<{ task_id: string }>(`/review/${ms.id}`, {
        method: "POST",
      });
      const t = await pollTask(task_id, (u) =>
        setTask({ step: u.step, progress: u.progress })
      );
      if (t.status === "error") setError(t.error || "Review failed");
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
      const t = await pollTask(task_id, undefined, 2500);
      if (t.status === "error") setError(t.error || "Verification failed");
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
        await api(`/review-issues/${issue.id}`, {
          method: "PATCH",
          body: JSON.stringify({ action, edit: edit || null }),
        });
        await load();
        refreshMs();
        refreshEvidence();
      } catch {
        await load();
      }
    },
    [load, refreshMs, refreshEvidence]
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
          <ChevronLeft className="h-3.5 w-3.5" /> All issues
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
            Location: {selected.section || "—"} · page {selected.page || "?"}
          </div>
        </div>

        <div>
          <div className="section-title">Why it matters</div>
          <p className="text-[13px] leading-snug mt-1">{selected.description}</p>
        </div>

        {selected.quote && (
          <button
            onClick={() => requestHighlight(selected.page, selected.quote, "review")}
            className="text-left rounded-lg bg-warn/5 border border-warn/30 px-3 py-2 text-xs italic text-ink hover:border-warn transition-colors"
          >
            “{selected.quote.slice(0, 180)}”
            <span className="not-italic text-warn block mt-0.5">→ highlight in PDF</span>
          </button>
        )}

        <div>
          <div className="section-title">Suggested action</div>
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
              <FileText className="h-3.5 w-3.5" /> Highlight in PDF
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn btn-outline text-xs"
            >
              View source
            </button>
            {editing ? (
              <button
                onClick={() => act(selected, "accept", editText)}
                className="btn btn-primary text-xs"
              >
                <Check className="h-3.5 w-3.5" /> Accept edited fix
              </button>
            ) : (
              <>
                <button
                  onClick={() => act(selected, "accept")}
                  className="btn btn-primary text-xs"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditText(selected.suggestion);
                  }}
                  className="btn btn-outline text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </>
            )}
            <button
              onClick={() => act(selected, "reject")}
              className="btn btn-danger text-xs"
            >
              <X className="h-3.5 w-3.5" /> Dismiss
            </button>
          </div>
        ) : (
          <div className="text-xs font-medium text-inkmut">
            {selected.status === "accepted" ? "✓ Fix accepted" : "Dismissed"}
          </div>
        )}
      </div>
    );
  }

  /* ---------- list / workflow ---------- */
  return (
    <div className="p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-brand" />
          <h2 className="font-serif font-semibold">Review</h2>
        </div>
        <p className="text-[11px] text-inkmut mt-0.5">
          Anchored, evidenced issues. Accepting a fix moves the readiness score.
        </p>
      </div>

      {!task && (
        <button onClick={runReview} className="btn btn-primary self-start">
          <Play className="h-3.5 w-3.5" />
          {issues.length ? "Re-run review" : "Run peer review"}
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
            {v === "citations" ? `Citations (${refs.length})` : `Issues (${open.length})`}
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
                <div className="text-[10px] mt-0.5">Resolved</div>
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
                No review yet — run it to get actionable, anchored issues.
              </div>
            )}
            {issues.length > 0 && listed.length === 0 && (
              <div className="text-xs text-inkmut py-4 text-center">
                Nothing in this group.
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
            Verify all against public corpus
          </button>
          <p className="text-[10px] text-inkmut -mt-1">
            Each reference is resolved against Semantic Scholar — the only place your
            manuscript crosses the public corpus.
          </p>
          <div className="flex flex-col divide-y divide-line/70">
            {refs.map((r) => {
              const st = REF_STATUS[r.status] || REF_STATUS.unverified;
              return (
                <div key={r.id} className="py-2">
                  <div className="text-xs leading-snug">
                    {r.title || r.raw?.slice(0, 120)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                    <span className={`font-semibold ${st.cls}`}>{st.label}</span>
                    {r.year && <span className="text-inkmut">{r.year}</span>}
                    {r.resolved_meta?.url && (
                      <a
                        href={r.resolved_meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pub underline ml-auto"
                      >
                        open source
                      </a>
                    )}
                  </div>
                  {r.status === "suspect" && r.resolved_meta && (
                    <div className="text-[10px] text-warn mt-0.5">
                      Closest match: {r.resolved_meta.title?.slice(0, 90)} (
                      {r.resolved_meta.year})
                    </div>
                  )}
                </div>
              );
            })}
            {refs.length === 0 && (
              <div className="text-xs text-inkmut py-4 text-center">
                No references extracted from this manuscript.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
