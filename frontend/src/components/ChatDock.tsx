"use client";
/* Unified "Ask PaperClue" chat — one assistant, one UI, available on every
   authenticated screen via a floating dock. It adapts its SCOPE to context:
   when a manuscript workspace is open (route /manuscripts/{id}/…) it grounds on
   that manuscript via the existing /insight/{id}/chat SSE endpoint. The other
   scopes (this paper / your library / open question) are shown but disabled
   until their backend endpoints land. */
import { useMemo, useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, X, Send, Sparkles, FileText, BookMarked, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { sseStream } from "@/lib/api";

type Source = { page?: number; section?: string; quote?: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };
type Scope = "manuscript" | "paper" | "library" | "open";

export default function ChatDock() {
  const { session } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Manuscript context from the route: /manuscripts/{id}/...
  const msId = useMemo(() => {
    const m = pathname?.match(/\/manuscripts\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);
  const scope: Scope = msId ? "manuscript" : "open";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Hide on public pages / when signed out — the dock is for authed workspaces.
  const publicRoute = pathname === "/" || pathname === "/login";
  if (!session || publicRoute) return null;

  const canSend = scope === "manuscript"; // batch 1: only the manuscript scope is wired

  async function ask() {
    const q = question.trim();
    if (!q || streaming || !canSend || !msId) return;
    setQuestion("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      await sseStream(
        `/insight/${msId}/chat`,
        { question: q, history },
        {
          onDelta: (txt: string) =>
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + txt };
              return next;
            }),
          onSources: (sources: unknown) =>
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], sources: sources as Source[] };
              return next;
            }),
          onError: (e: string) =>
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], content: `⚠️ ${e}` };
              return next;
            }),
          onDone: () => {},
        }
      );
    } finally {
      setStreaming(false);
    }
  }

  const SCOPES: { id: Scope; label: string; icon: typeof FileText }[] = [
    { id: "manuscript", label: t("chat_scope_manuscript"), icon: FileText },
    { id: "paper", label: t("chat_scope_paper"), icon: Sparkles },
    { id: "library", label: t("chat_scope_library"), icon: BookMarked },
    { id: "open", label: t("chat_scope_open"), icon: Globe },
  ];

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand text-ink shadow-lift px-4 py-3 font-semibold text-sm hover:bg-brand-deep hover:text-white transition-colors"
          aria-label={t("chat_dock_title")}
        >
          <MessageSquare className="h-5 w-5" />
          {t("chat_dock_title")}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[85vh] w-[380px] max-w-[92vw] flex-col rounded-2xl border border-line bg-paper shadow-drawer dark:bg-dark-surface dark:border-dark-line">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 dark:border-dark-line">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-brand-deep">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink dark:text-dark-ink">{t("chat_dock_title")}</div>
              <div className="text-[11px] text-inkmut dark:text-dark-inkmut">
                {scope === "manuscript" ? t("chat_grounded_manuscript") : t("chat_pick_context")}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-inkmut hover:text-ink dark:hover:text-dark-ink" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scope chips */}
          <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2 dark:border-dark-line">
            {SCOPES.map((s) => {
              const active = s.id === scope;
              const Icon = s.icon;
              return (
                <span
                  key={s.id}
                  title={active ? undefined : t("chat_coming_soon")}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    active
                      ? "bg-brand-soft text-brand-deep"
                      : "text-inkmut/60 dark:text-dark-inkmut/60"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {s.label}
                </span>
              );
            })}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="panel-scroll flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="mt-6 text-center text-[13px] text-inkmut dark:text-dark-inkmut">
                {scope === "manuscript" ? t("chat_empty_manuscript") : t("chat_empty_pick")}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand text-ink"
                      : "bg-surface2 text-ink dark:bg-dark-surface2 dark:text-dark-ink"
                  }`}
                >
                  {m.role === "assistant" && m.content ? (
                    <div className="report-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content || (streaming ? "…" : "")
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.sources.map((s, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] text-inkmut dark:border-dark-line dark:bg-dark-surface"
                          title={s.quote}
                        >
                          {s.section ? `${s.section} ` : ""}p.{s.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-line p-3 dark:border-dark-line">
            {!canSend && (
              <div className="mb-2 rounded-lg bg-surface2 px-3 py-2 text-[11px] text-inkmut dark:bg-dark-surface2 dark:text-dark-inkmut">
                {t("chat_open_a_manuscript")}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-line bg-ivory px-3 py-2 dark:border-dark-line dark:bg-dark-bg">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                rows={1}
                disabled={!canSend || streaming}
                placeholder={t("chat_placeholder")}
                className="flex-1 resize-none bg-transparent text-[13px] text-ink outline-none disabled:opacity-50 dark:text-dark-ink"
              />
              <button
                onClick={ask}
                disabled={!canSend || streaming || !question.trim()}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-ink transition-opacity hover:bg-brand-deep hover:text-white disabled:opacity-40"
                aria-label={t("chat_send")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
