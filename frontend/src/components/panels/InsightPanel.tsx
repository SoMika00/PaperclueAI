"use client";
/* Paper Insight v2: tabbed brief (Overview / Claims / Methods / Limitations)
   + grounded chat. One idea per block, each with a location, a proof and an
   action. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  FileText,
  Lightbulb,
  MessageSquare,
  ScrollText,
  Send,
  Sparkles,
} from "lucide-react";
import { api, sseStream } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import type { AnchoredClaim, InsightBrief } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { Spinner } from "../ui";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  sources?: { page: number; section: string; quote: string }[];
}

const TABS = ["Overview", "Claims", "Methods", "Limitations", "Chat"] as const;
const TAB_LABEL_KEY: Record<string, string> = {
  Overview: "tab_overview",
  Claims: "tab_claims",
  Methods: "tab_methods",
  Limitations: "tab_limitations",
  Chat: "tab_chat",
};
type Tab = (typeof TABS)[number];

function Block({
  label,
  item,
}: {
  label: string;
  item: AnchoredClaim | undefined;
}) {
  const { t } = useLocale();
  const { requestHighlight, setDrawerOpen } = useWorkspace();
  if (!item?.claim) return null;
  return (
    <div className="py-3 border-b border-line/70 last:border-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-deep">
        {label}
      </div>
      <p className="text-[13px] leading-snug mt-1 text-ink">{item.claim}</p>
      <div className="text-[11px] text-inkmut mt-1">
        {item.section || "—"} · page {item.page || "?"}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <button
          onClick={() => requestHighlight(item.page, item.quote)}
          className="btn btn-outline text-[11px] py-0.5 px-2"
        >
          <FileText className="h-3 w-3" /> {t("open_in_pdf")}
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn btn-ghost text-[11px] py-0.5 px-2"
        >
          <ScrollText className="h-3 w-3" /> {t("view_evidence")}
        </button>
      </div>
    </div>
  );
}

export default function InsightPanel() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const { ms, requestHighlight, refreshEvidence, refreshMs } = useWorkspace();
  const [brief, setBrief] = useState<InsightBrief | null>((ms.insight as any) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(requestedView === "gaps" ? "Limitations" : "Overview");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ insight: InsightBrief }>(`/insight/${ms.id}`, {
        method: "POST",
      });
      setBrief(res.insight);
      refreshEvidence();
      refreshMs();
    } catch (e: any) {
      setError(e.message?.slice(0, 200) || t("insight_failed"));
    } finally {
      setLoading(false);
    }
  }, [ms.id, refreshEvidence, refreshMs]);

  useEffect(() => {
    if (!brief && !loading) build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (requestedView === "gaps") setTab("Limitations");
    else if (requestedView === "summary" || requestedView === "concepts") setTab("Overview");
    if (brief && requestedView) {
      window.setTimeout(() => document.getElementById(`insight-${requestedView}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [brief, requestedView]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q || streaming) return;
    setQuestion("");
    setStreaming(true);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ]);
    await sseStream(`/insight/${ms.id}/chat`, { question: q, history }, {
      onSources: (sources) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], sources };
          return next;
        }),
      onDelta: (text) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + text };
          return next;
        }),
      onError: (e) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: last.content || `⚠ ${String(e).slice(0, 160)}`,
          };
          return next;
        }),
    });
    setStreaming(false);
    refreshEvidence();
  }, [question, streaming, messages, ms.id, refreshEvidence]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <h2 className="font-serif font-semibold">{t("paper_insight_title")}</h2>
          {loading && <Spinner className="h-3.5 w-3.5 text-brand" />}
        </div>
        <div className="flex gap-0.5 mt-3 border-b border-line -mx-4 px-3 overflow-x-auto">
          {TABS.map((tabItem) => (
            <button
              key={tabItem}
              onClick={() => setTab(tabItem)}
              className={`px-2.5 py-1.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === tabItem
                  ? "border-brand text-brand-deep"
                  : "border-transparent text-inkmut hover:text-ink"
              }`}
            >
              {t(TAB_LABEL_KEY[tabItem] as any)}
              {tabItem === "Chat" && <MessageSquare className="h-3 w-3 inline ml-1 -mt-0.5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-4 pb-4">
        {error && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger/5 p-3 text-xs text-danger flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div>
              {error}
              <button onClick={build} className="block underline mt-1">
                {t("retry_label")}
              </button>
            </div>
          </div>
        )}
        {loading && !brief && (
          <div className="mt-4 text-sm text-inkmut flex items-center gap-2">
            <Spinner /> {t("reading_manuscript")}
          </div>
        )}

        {brief && tab === "Overview" && (
          <div>
            <div id="insight-summary">
              <Block label={t("main_contribution")} item={brief.contribution} />
              <Block label={t("problem_addressed")} item={brief.problem} />
            </div>
            {(brief.keywords || []).length > 0 && (
              <div id="insight-concepts" className="py-3 border-b border-line/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-inkmut">
                  {t("key_concepts")}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {brief.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-brand-soft text-brand-deep px-2 py-0.5 text-[11px] font-medium"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(brief.gap_hints || []).length > 0 && (
              <div id="insight-gaps" className="py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-uni">
                  <Lightbulb className="h-3.5 w-3.5" /> {t("research_gaps_nonblocking")}
                </div>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {brief.gap_hints.map((g, i) => (
                    <li key={i} className="text-xs text-ink leading-snug">
                      · {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {brief && tab === "Claims" && (
          <div>
            <Block label={t("contribution_label")} item={brief.contribution} />
            {(brief.key_results || []).map((r, i) => (
              <Block key={i} label={`${t("key_result_label")} ${i + 1}`} item={r} />
            ))}
          </div>
        )}

        {brief && tab === "Methods" && (
          <div>
            <Block label={t("method_label")} item={brief.method} />
            <div className="py-3 text-xs text-inkmut">
              {t("ask_chat_details")}
            </div>
          </div>
        )}

        {brief && tab === "Limitations" && (
          <div id="insight-gaps">
            {(brief.limitations || []).map((l, i) => (
              <Block key={i} label={`${t("limitation_label")} ${i + 1}`} item={l} />
            ))}
            {(brief.gap_hints || []).length > 0 && (
              <div className="py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-uni">
                  <Lightbulb className="h-3.5 w-3.5" /> {t("research_gaps")}
                </div>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {brief.gap_hints.map((g, i) => (
                    <li key={i} className="text-xs text-ink leading-snug">
                      · {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "Chat" && (
          <div className="flex flex-col gap-2 pt-3">
            {messages.length === 0 && (
              <div className="text-[11px] text-inkmut">
                {t("chat_grounded_note")}{" "}
                <button
                  className="underline"
                  onClick={() =>
                    setQuestion(t("chat_example_question"))
                  }
                >
                  “{t("chat_example_question")}”
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand text-white self-end max-w-[92%]"
                    : "bg-surface2 text-ink self-start w-full"
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-1.5 text-inkmut">
                    <Spinner className="h-3 w-3" /> {t("thinking_label")}
                  </span>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.sources.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => requestHighlight(s.page, s.quote)}
                        className="rounded-full bg-manuscript-soft text-manuscript border border-manuscript/40 px-2 py-0.5 text-[10px] font-medium hover:bg-manuscript hover:text-white transition-colors"
                      >
                        p.{s.page} {s.section ? `· ${s.section}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {tab === "Chat" && (
        <div className="p-3 border-t border-line flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={t("ask_manuscript_placeholder")}
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={ask}
            disabled={streaming || !question.trim()}
            className="btn btn-primary"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
