"use client";
/* Federated grounded search, used by the global Literature Explorer and by
   Related Research inside a manuscript. Two views: Papers (result list) and
   Synthesis (sourced report with inspectable citations). */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Network,
  Search,
} from "lucide-react";
import { api, pollTask } from "@/lib/api";
import type { BrowsePaper } from "@/lib/types";
import { ScopeBadge, Spinner, TaskProgress } from "./ui";

const SCOPES = [
  { id: "combined", label: "All" },
  { id: "public", label: "Public" },
  { id: "university", label: "University" },
] as const;

function linkCitations(md: string): string {
  return md.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_, nums: string) =>
    nums
      .split(",")
      .map((n) => n.trim())
      .map((n) => `[[${n}]](#paper-${n})`)
      .join(" ")
  );
}

export default function LiteratureSearch({
  manuscriptId,
  prefill,
  placeholder = "Search papers, methods, datasets or research questions…",
}: {
  manuscriptId?: string;
  /** "query#nonce" — setting it fills the box and runs the search */
  prefill?: string | null;
  placeholder?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("combined");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [view, setView] = useState<"papers" | "synthesis">("papers");
  const [task, setTask] = useState<{ step: string; progress: number } | null>(null);
  const [papers, setPapers] = useState<BrowsePaper[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [creatingMap, setCreatingMap] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const run = useCallback(
    async (q0?: string) => {
      const q = (q0 ?? query).trim();
      if (!q || task) return;
      setError(null);
      setNotice(null);
      setReport(null);
      setPapers([]);
      setLastQuery(q);
      setTask({ step: "Retrieving papers…", progress: 5 });
      try {
        const { task_id } = await api<{ task_id: string }>("/browse", {
          method: "POST",
          body: JSON.stringify({
            query: q,
            scope,
            manuscript_id: manuscriptId || null,
            year_from: yearFrom ? parseInt(yearFrom, 10) : null,
          }),
        });
        const t = await pollTask<{
          papers: BrowsePaper[];
          report: string | null;
          warnings?: string[];
        }>(task_id, (u) => {
          setTask({ step: u.step, progress: u.progress });
          if (u.result?.papers) setPapers(u.result.papers);
        });
        if (t.status === "error") setError(t.error || "Search failed");
        else if (t.result) {
          setPapers(t.result.papers || []);
          setReport(t.result.report);
          if (t.result.warnings?.length) setNotice(t.result.warnings.join(" "));
        }
      } catch (e: any) {
        setError(e.message?.slice(0, 200));
      } finally {
        setTask(null);
      }
    },
    [query, scope, yearFrom, task, manuscriptId]
  );

  // Deep link: ?q=…
  useEffect(() => {
    const q = params.get("q");
    if (q && !lastQuery) {
      setQuery(q);
      run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suggested-search chips (Related Research) push a "query#nonce" prefill.
  useEffect(() => {
    if (!prefill) return;
    const q = prefill.split("#")[0];
    setQuery(q);
    run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const save = useCallback(async (p: BrowsePaper) => {
    try {
      await api("/library", {
        method: "POST",
        body: JSON.stringify({
          corpus_id: p.corpus_id,
          title: p.title,
          authors: p.authors || [],
          year: p.year,
          venue: p.venue || "",
          abstract: p.abstract || "",
          url: p.url,
          source_scope: p.source_scope,
        }),
      });
      setSaved((s) => new Set(s).add(p.corpus_id));
    } catch {
      /* keep UI state */
    }
  }, []);

  const createMap = useCallback(async () => {
    if (!lastQuery || creatingMap) return;
    setCreatingMap(true);
    try {
      const { id } = await api<{ id: string }>("/mindmaps", {
        method: "POST",
        body: JSON.stringify({ seed_type: "question", question: lastQuery }),
      });
      router.push(`/mind-maps/${id}`);
    } catch (e: any) {
      setError(e.message?.slice(0, 160));
      setCreatingMap(false);
    }
  }, [lastQuery, creatingMap, router]);

  const jumpTo = useCallback((n: string) => {
    setView("papers");
    setTimeout(() => {
      const el = document.getElementById(`paper-${n}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("hl-flash");
        void el.offsetWidth;
        el.classList.add("hl-flash");
      }
    }, 80);
  }, []);

  const linked = useMemo(() => (report ? linkCitations(report) : null), [report]);

  return (
    <div className="flex flex-col gap-4">
      {/* Query bar */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder={placeholder}
              className="w-full rounded-lg border border-line bg-paper pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <button onClick={() => run()} disabled={!!task || !query.trim()} className="btn btn-primary">
            {task ? <Spinner className="h-4 w-4" /> : "Search"}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-line overflow-hidden">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  scope === s.id ? "bg-brand text-white" : "bg-paper text-inkmut hover:bg-surface2"
                }`}
              >
                {s.label}
                {s.id === "public" && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-pub align-middle" />}
                {s.id === "university" && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-uni align-middle" />}
              </button>
            ))}
          </div>
          <select
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="rounded-lg border border-line bg-paper px-2 py-1 text-xs text-inkmut"
          >
            <option value="">Any year</option>
            <option value="2024">2024 +</option>
            <option value="2022">2022 +</option>
            <option value="2020">2020 +</option>
          </select>
          <span className="text-[11px] text-inkmut ml-auto">
            Every citation is linked to an inspectable source.
          </span>
        </div>
      </div>

      {task && <TaskProgress step={task.step} progress={task.progress} />}
      {error && <div className="card p-3 text-xs text-danger">{error}</div>}
      {notice && (
        <div className="card p-3 text-xs text-warn bg-uni-soft/60 border-uni/30">{notice}</div>
      )}

      {(papers.length > 0 || report) && (
        <div className="flex items-center gap-1 border-b border-line">
          {(["papers", "synthesis"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                view === v ? "border-brand text-brand-deep" : "border-transparent text-inkmut hover:text-ink"
              }`}
            >
              {v === "papers" ? "Results" : "Evidence synthesis"}
            </button>
          ))}
          <button
            onClick={createMap}
            disabled={creatingMap}
            className="btn btn-outline ml-auto mb-1 text-xs"
          >
            {creatingMap ? <Spinner className="h-3.5 w-3.5" /> : <Network className="h-3.5 w-3.5" />}
            Create map from this search
          </button>
        </div>
      )}

      {view === "papers" && (
        <div className="flex flex-col divide-y divide-line/70">
          {papers.map((p) => (
            <div key={p.corpus_id} id={`paper-${p.ref_index}`} className="py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-inkmut">[{p.ref_index}]</span>
                <ScopeBadge scope={p.source_scope} />
                {p.collection && <span className="text-[11px] text-uni">{p.collection}</span>}
              </div>
              {p.source_scope === "university" ? (
                <a
                  href={`/paperclue/university/${p.corpus_id}`}
                  className="block font-medium text-[14px] leading-snug mt-1 hover:text-brand-deep hover:underline"
                >
                  {p.title}
                </a>
              ) : (
                <div className="font-medium text-[14px] leading-snug mt-1">{p.title}</div>
              )}
              <div className="text-xs text-inkmut mt-0.5">
                {(p.authors || []).slice(0, 4).join(", ")}
                {p.authors?.length > 4 ? " et al." : ""}
                {p.year ? ` · ${p.year}` : ""}
                {p.venue ? ` · ${p.venue.slice(0, 50)}` : ""}
              </div>
              {p.rank_explanation && (
                <div className="text-[11px] text-brand-deep mt-1">
                  Why it matches: {p.rank_explanation}
                </div>
              )}
              {(p.tldr || p.abstract) && (
                <p className="text-xs text-inkmut leading-snug mt-1 line-clamp-2">
                  {p.tldr || p.abstract}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => save(p)}
                  className="btn btn-outline text-[11px] py-0.5 px-2"
                  disabled={saved.has(p.corpus_id)}
                >
                  {saved.has(p.corpus_id) ? (
                    <>
                      <BookmarkCheck className="h-3 w-3 text-manuscript" /> In your library
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3 w-3" /> Add to my research
                    </>
                  )}
                </button>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline text-[11px] py-0.5 px-2"
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                )}
                {p.open_access_pdf_url && (
                  <a
                    href={p.open_access_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline text-[11px] py-0.5 px-2"
                  >
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
          {papers.length === 0 && !task && (
            <div className="text-center text-sm text-inkmut py-12">
              Search across the public literature and your university corpus —
              results carry their provenance badge.
            </div>
          )}
        </div>
      )}

      {view === "synthesis" && (
        <article className="report-md max-w-2xl">
          {linked ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const m = href?.match(/^#paper-(\d+)$/);
                  if (m)
                    return (
                      <button
                        onClick={() => jumpTo(m[1])}
                        className="inline-block align-super text-[10px] font-bold text-brand-deep bg-brand-soft rounded px-1 mx-0.5 hover:bg-brand hover:text-white transition-colors"
                      >
                        {m[1]}
                      </button>
                    );
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-pub underline">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {linked}
            </ReactMarkdown>
          ) : (
            <div className="text-sm text-inkmut py-8">
              The synthesis is generated from the retrieved sources — run a search first.
            </div>
          )}
        </article>
      )}
    </div>
  );
}
