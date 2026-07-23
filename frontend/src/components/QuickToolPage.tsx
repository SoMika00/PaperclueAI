"use client";
/* Shared page for the one-shot "Quick Tools" that call the deployed Supabase
   edge functions. Login-only app (SignInGate handles auth), so there is no
   guest/locked gating here. Remembers the attached document across follow-up
   questions and example-chip clicks so it is never re-requested. */
import { useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { callEdgeFunction, type EdgeFunctionName } from "@/lib/edge-functions";
import { parseFile, isSupportedFile, type ParsedDocument } from "@/lib/parse-file";

export function QuickToolPage({
  titleKey,
  taglineKey,
  edgeFunction,
  requiresDocument = false,
  chipKeys = [],
  buildBody,
  renderResult,
  accent = "#FF8A3D",
}: {
  titleKey: string;
  taglineKey: string;
  edgeFunction: EdgeFunctionName;
  requiresDocument?: boolean;
  chipKeys?: string[];
  buildBody: (prompt: string, doc: ParsedDocument | null) => Record<string, unknown>;
  /** Renders the structured response; return null to fall back to raw JSON. */
  renderResult: (data: Record<string, unknown>) => ReactNode;
  accent?: string;
}) {
  const { t, locale } = useLocale();
  // These key props are dynamic strings (passed per tool), so narrow to the
  // dict key type the strict t() expects.
  const tk = (k: string) => t(k as Parameters<typeof t>[0]);
  const [value, setValue] = useState("");
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ prompt: string; data: Record<string, unknown> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  async function handleFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!isSupportedFile(file)) {
      setError(t("tool_unsupported_file"));
      return;
    }
    setParsing(true);
    try {
      setDoc(await parseFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tool_read_failed"));
    } finally {
      setParsing(false);
    }
  }

  async function submit(prompt: string) {
    setError(null);
    if (requiresDocument && !doc) {
      setError(t("tool_attach_first"));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const body = { ...buildBody(prompt, doc), lang: locale };
      const data = await callEdgeFunction<Record<string, unknown>>(edgeFunction, body);
      setResult({ prompt, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMITED") setError(t("tool_rate_limited"));
      else if (msg === "NO_SESSION") setError(t("tool_no_session"));
      else setError(t("tool_failed"));
    } finally {
      setLoading(false);
    }
  }

  function renderBody(data: Record<string, unknown>): ReactNode {
    if (typeof data.raw_response === "string") {
      return (
        <div className="report-md text-ink dark:text-dark-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.raw_response}</ReactMarkdown>
        </div>
      );
    }
    return (
      renderResult(data) ?? (
        <pre className="text-xs text-inkmut whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      )
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="font-serif text-[26px] font-semibold text-ink dark:text-dark-ink">{tk(titleKey)}</h1>
      <p className="text-[13.5px] text-inkmut dark:text-dark-inkmut mt-1">{tk(taglineKey)}</p>

      {/* Composer */}
      <div className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card dark:border-dark-line dark:bg-dark-surface">
        <div className="flex items-center gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-outline text-[13px]"
          >
            <Paperclip className="h-3.5 w-3.5" /> {t("tool_attach_paper")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.tex"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <span className={`text-xs truncate ${doc ? "text-manuscript" : "text-inkmut dark:text-dark-inkmut"}`}>
            {parsing
              ? t("tool_reading")
              : doc
              ? `${doc.filename} · ${doc.words.toLocaleString()} ${t("tool_words")}`
              : t("tool_file_hint")}
          </span>
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-line bg-ivory px-3 py-2 dark:border-dark-line dark:bg-dark-bg">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (value.trim() || !requiresDocument) submit(value.trim());
              }
            }}
            rows={2}
            placeholder={t("tool_prompt_placeholder")}
            className="flex-1 resize-none bg-transparent text-[14px] text-ink outline-none dark:text-dark-ink"
          />
          <button
            type="button"
            onClick={() => submit(value.trim())}
            disabled={loading || parsing}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: accent }}
            aria-label={t("tool_send")}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Example chips */}
      {chipKeys.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chipKeys.map((k) => (
            <button
              key={k}
              onClick={() => {
                setValue(tk(k));
                requestAnimationFrame(() => taRef.current?.focus());
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] text-ink hover:border-brand dark:border-dark-line dark:bg-dark-surface dark:text-dark-ink transition-colors"
            >
              <span className="text-brand">✦</span>
              {tk(k)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center gap-3 text-inkmut dark:text-dark-inkmut">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: accent }} />
          <span className="text-[13px]">{t("tool_working")}</span>
        </div>
      )}

      {result && !loading && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-card dark:border-dark-line dark:bg-dark-surface">
          <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5 dark:border-dark-line">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} />
            <span className="truncate text-sm font-semibold text-ink dark:text-dark-ink">
              &ldquo;{result.prompt || tk(titleKey)}&rdquo;
            </span>
          </div>
          <div className="px-5 py-3">{renderBody(result.data)}</div>
        </div>
      )}
    </div>
  );
}
