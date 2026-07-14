"use client";
/* Journal Formatting: pick a target journal -> compliance checklist,
   before/after abstract diff, restructure plan, DOCX export. */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileOutput,
  Play,
  XCircle,
} from "lucide-react";
import { BASE, api, pollTask } from "@/lib/api";
import { useWorkspace } from "@/lib/ws";
import { Spinner, TaskProgress } from "../ui";

interface Journal {
  id: string;
  name: string;
  article_type: string;
  rules: string[];
}

interface FormatResult {
  journal: string;
  journal_id: string;
  checklist: { rule: string; status: "pass" | "fail" | "warning"; detail: string }[];
  rewrite: {
    abstract_before?: string;
    abstract_after?: string;
    restructure_plan?: { from: string; to: string; note: string }[];
    added_statements?: string[];
  };
}

const CHECK_ICON = {
  pass: <CheckCircle2 className="h-4 w-4 text-manuscript shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-warn shrink-0" />,
  fail: <XCircle className="h-4 w-4 text-danger shrink-0" />,
};

export default function FormatPanel() {
  const { ms, refreshEvidence } = useWorkspace();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [journal, setJournal] = useState<string>("scientific-reports");
  const [task, setTask] = useState<{ step: string; progress: number } | null>(null);
  const [result, setResult] = useState<FormatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Journal[]>("/journals").then(setJournals).catch(() => {});
  }, []);

  const run = useCallback(async () => {
    setError(null);
    setResult(null);
    setTask({ step: "Loading journal profile…", progress: 5 });
    try {
      const { task_id } = await api<{ task_id: string }>(
        `/format/${ms.id}?journal=${journal}`,
        { method: "POST" }
      );
      const t = await pollTask<FormatResult>(task_id, (u) =>
        setTask({ step: u.step, progress: u.progress })
      );
      if (t.status === "error") setError(t.error || "Formatting failed");
      else {
        setResult(t.result);
        refreshEvidence();
      }
    } catch (e: any) {
      setError(e.message?.slice(0, 200));
    } finally {
      setTask(null);
    }
  }, [ms.id, journal, refreshEvidence]);

  const selected = journals.find((j) => j.id === journal);
  const passCount = result?.checklist.filter((c) => c.status === "pass").length ?? 0;

  return (
    <div className="p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <FileOutput className="h-4 w-4 text-brand-deep" />
          <h2 className="font-serif font-semibold">Journal Formatting</h2>
        </div>
        <p className="text-[11px] text-inkmut mt-0.5">
          Check compliance against the target journal&apos;s real guidelines, preview the
          rewrite, export DOCX.
        </p>
        <div className="mt-2 rounded-lg bg-surface2 border border-line px-2.5 py-1.5 text-[11px] text-inkmut">
          <strong className="text-ink">PDF detected.</strong> You can run a full
          compliance review and export a restructured DOCX. Upload a DOCX/LaTeX
          source to apply formatting changes in place (coming soon).
        </div>
      </div>

      <div className="flex gap-2">
        <select
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {journals.length === 0 && (
            <option value="scientific-reports">Scientific Reports</option>
          )}
          {journals.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name} — {j.article_type}
            </option>
          ))}
        </select>
        <button onClick={run} disabled={!!task} className="btn btn-primary">
          {task ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          Check
        </button>
      </div>

      {selected && !result && !task && (
        <div className="card p-3">
          <div className="text-[11px] font-semibold text-inkmut uppercase tracking-wide">
            {selected.name} — submission rules
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {selected.rules.map((r) => (
              <li key={r} className="text-xs text-ink/80 leading-snug">
                · {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {task && <TaskProgress step={task.step} progress={task.progress} />}
      {error && <div className="text-xs text-danger">{error}</div>}

      {result && (
        <div className="flex flex-col gap-3">
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold font-serif">
                Compliance — {result.journal}
              </span>
              <span
                className={`badge border ${
                  passCount === result.checklist.length
                    ? "badge-manuscript"
                    : "bg-warn/10 text-warn border-warn/30"
                }`}
              >
                {passCount}/{result.checklist.length} pass
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {result.checklist.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  {CHECK_ICON[c.status] || CHECK_ICON.warning}
                  <div>
                    <div className="text-xs font-medium leading-snug">{c.rule}</div>
                    <div className="text-[11px] text-inkmut leading-snug">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.rewrite?.abstract_after && (
            <div className="card p-3">
              <div className="text-[11px] font-semibold text-inkmut uppercase tracking-wide mb-2">
                Abstract — before / after
              </div>
              <div className="rounded-lg bg-danger/5 border border-danger/10 p-2.5 text-[11px] leading-snug text-ink/60">
                {result.rewrite.abstract_before?.slice(0, 600)}
              </div>
              <div className="rounded-lg bg-manuscript-soft border border-manuscript/20 p-2.5 text-[11px] leading-snug text-ink/85 mt-1.5">
                {result.rewrite.abstract_after}
              </div>
            </div>
          )}

          {(result.rewrite?.restructure_plan || []).length > 0 && (
            <div className="card p-3">
              <div className="text-[11px] font-semibold text-inkmut uppercase tracking-wide mb-1.5">
                Restructure plan
              </div>
              {result.rewrite.restructure_plan!.map((r, i) => (
                <div key={i} className="text-xs leading-snug py-1 border-b border-ink/5 last:border-0">
                  <span className="font-medium">{r.from}</span>
                  <span className="text-inkmut"> → </span>
                  <span className="font-medium text-brand-deep">{r.to}</span>
                  {r.note && <div className="text-[11px] text-inkmut">{r.note}</div>}
                </div>
              ))}
            </div>
          )}

          {(result.rewrite?.added_statements || []).length > 0 && (
            <div className="card p-3 bg-brand-soft/50 border-brand/20">
              <div className="text-[11px] font-semibold text-brand-deep uppercase tracking-wide mb-1">
                Added statements (drafts)
              </div>
              {result.rewrite.added_statements!.map((s, i) => (
                <p key={i} className="text-[11px] text-ink/80 leading-snug mb-1">
                  {s}
                </p>
              ))}
            </div>
          )}

          <a
            href={`${BASE}/format/${ms.id}/export?journal=${result.journal_id}`}
            className="btn btn-primary self-start"
          >
            <Download className="h-3.5 w-3.5" /> Export DOCX ({result.journal})
          </a>
        </div>
      )}
    </div>
  );
}
