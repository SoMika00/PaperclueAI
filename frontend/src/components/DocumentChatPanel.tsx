"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { sseStream } from "@/lib/api";
import { useWorkspace } from "@/lib/ws";
import { Spinner } from "./ui";

const PROMPTS: Record<string, string> = {
  explain: "Explain this paper in plain language: its problem, approach, results, and limitations. Cite the relevant pages.",
  figures: "List every figure in the paper and explain what each figure shows. Cite the page for every figure.",
  tables: "List every table in the paper, summarize its data and explain the main takeaway. Cite the page for every table.",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { page: number; section: string; quote: string }[];
}

export default function DocumentChatPanel() {
  const { ms, requestHighlight, refreshMs } = useWorkspace();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState(() => PROMPTS[searchParams.get("prompt") || ""] || "");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q || streaming) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setQuestion("");
    setStreaming(true);
    setMessages((current) => [...current, { role: "user", content: q },
      { role: "assistant", content: "" }]);
    await sseStream(`/insight/${ms.id}/chat`, { question: q, history }, {
      onSources: (sources) => setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { ...next[next.length - 1], sources };
        return next;
      }),
      onDelta: (delta) => setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + delta };
        return next;
      }),
      onError: (error) => setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content || `⚠ ${error}` };
        return next;
      }),
    });
    setStreaming(false);
    refreshMs();
  }, [messages, ms.id, question, refreshMs, streaming]);

  return (
    <div className="h-full flex flex-col bg-paper dark:bg-dark-surface">
      <div className="px-5 py-4 border-b border-line dark:border-dark-line">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand" />
          <h1 className="font-serif font-semibold">Chat with this paper</h1>
        </div>
        <p className="text-[11px] text-inkmut mt-1 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-manuscript" />
          Answers use only this document and link back to source pages.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-5 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="rounded-xl border border-line bg-surface2/60 p-4 text-sm text-inkmut">
            <div className="font-medium text-ink mb-2">Start with a question</div>
            {["What is the main contribution?", "Explain the methodology", "What limitations do the authors mention?"].map((q) => (
              <button key={q} onClick={() => setQuestion(q)}
                className="block text-left text-xs text-brand-deep hover:underline mt-1.5">
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
            message.role === "user" ? "bg-brand text-white self-end max-w-[88%]" :
              "bg-surface2 text-ink self-start w-full"
          }`}>
            {message.content || <Spinner className="h-3.5 w-3.5" />}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-line/60 flex flex-wrap gap-1.5">
                {message.sources.map((source, sourceIndex) => (
                  <button key={sourceIndex}
                    onClick={() => requestHighlight(source.page, source.quote)}
                    className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-1 text-[10px] text-brand-deep border border-line">
                    <FileText className="h-3 w-3" /> p.{source.page} · {source.section}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-line dark:border-dark-line">
        <div className="flex gap-2">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
            }}
            placeholder="Ask about this paper…"
            className="flex-1 resize-none rounded-xl border border-line bg-surface2 px-3 py-2 text-sm outline-none focus:border-brand" />
          <button onClick={ask} disabled={streaming || !question.trim()}
            className="btn btn-primary self-end px-3 py-2">
            {streaming ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {ms.index_status !== "ready" && (
          <p className="text-[10px] text-inkmut mt-1.5">The private semantic index is created on your first question.</p>
        )}
      </div>
    </div>
  );
}
