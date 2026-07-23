"use client";
/* The living PDF: pdf.js via react-pdf, quote-anchored highlights, and
   selection -> "Explain" (PDF -> feature direction). Client-only. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useRouter } from "next/navigation";
import { FileSearch, Loader2, Sparkles, X } from "lucide-react";
import { BASE, api } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/ws";
import { Spinner } from "./ui";

// Served statically from public/ (copied by the prebuild script) — letting
// webpack bundle the worker makes SWC choke on the minified module.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function PdfViewer() {
  const { t } = useLocale();
  const { ms, highlight, refreshEvidence } = useWorkspace();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(680);
  const [selMenu, setSelMenu] = useState<{ x: number; y: number; text: string; page: number } | null>(null);
  const [explain, setExplain] = useState<{ loading: boolean; text: string } | null>(null);

  const fileUrl = useMemo(() => `${BASE}/manuscripts/${ms.id}/pdf`, [ms.id]);
  const [file, setFile] = useState<{ url: string; httpHeaders?: Record<string, string> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const token = data.session?.access_token;
      setFile({ url: fileUrl, httpHeaders: token ? { Authorization: `Bearer ${token}` } : {} });
    });
    return () => { cancelled = true; };
  }, [fileUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setWidth(Math.min(Math.max(el.clientWidth - 48, 380), 860))
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Feature -> PDF: scroll to the highlighted page and flash it.
  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`pdf-page-${highlight.page}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.remove("hl-flash");
        void el.offsetWidth;
        el.classList.add("hl-flash");
      }
    }, 60);
    return () => clearTimeout(t);
  }, [highlight]);

  // Quote-anchored highlighting on the text layer.
  const textRenderer = useCallback(
    (pageNumber: number) =>
      ({ str }: { str: string }) => {
        const safe = escapeHtml(str);
        if (!highlight || highlight.page !== pageNumber || !str.trim()) return safe;
        const q = norm(highlight.quote);
        const s = norm(str);
        if (!q || s.length < 4) return safe;
        const cls = `hl-${highlight.kind}`;
        // whole item inside the quote
        if (s.length > 10 && q.includes(s)) return `<mark class="${cls}">${safe}</mark>`;
        // quote inside the item -> wrap just the matching slice
        const idx = s.indexOf(q);
        if (idx >= 0) {
          // map normalized index back approximately on the raw string
          const rawIdx = str.toLowerCase().indexOf(highlight.quote.trim().slice(0, 20).toLowerCase());
          if (rawIdx >= 0) {
            const end = Math.min(rawIdx + highlight.quote.length, str.length);
            return (
              escapeHtml(str.slice(0, rawIdx)) +
              `<mark class="${cls}">${escapeHtml(str.slice(rawIdx, end))}</mark>` +
              escapeHtml(str.slice(end))
            );
          }
          return `<mark class="${cls}">${safe}</mark>`;
        }
        return safe;
      },
    [highlight]
  );

  // PDF -> feature: text selection opens a contextual "Explain" action.
  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (!sel || text.length < 15 || text.length > 1500) {
      setSelMenu(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const cont = containerRef.current?.getBoundingClientRect();
    if (!cont) return;
    let page = 1;
    let node: Node | null = range.startContainer;
    while (node) {
      if (node instanceof HTMLElement && node.dataset?.pdfPage) {
        page = parseInt(node.dataset.pdfPage, 10);
        break;
      }
      node = node.parentNode;
    }
    setSelMenu({
      x: rect.left - cont.left + rect.width / 2,
      y: rect.top - cont.top - 10,
      text,
      page,
    });
  }, []);

  const runExplain = useCallback(async () => {
    if (!selMenu) return;
    const { text, page } = selMenu;
    setSelMenu(null);
    setExplain({ loading: true, text: "" });
    try {
      const res = await api<{ explanation: string }>(`/insight/${ms.id}/explain`, {
        method: "POST",
        body: JSON.stringify({ text, page }),
      });
      setExplain({ loading: false, text: res.explanation });
      refreshEvidence();
    } catch (e: any) {
      setExplain({ loading: false, text: `${t("pdf_explain_failed")} ${e.message?.slice(0, 140)}` });
    }
  }, [selMenu, ms.id, refreshEvidence, t]);

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto panel-scroll bg-ink/[0.03]"
      onMouseUp={onMouseUp}
    >
      {file === null ? (
        <div className="flex items-center gap-2 p-8 text-inkmut"><Spinner /> {t("loading")}</div>
      ) : (
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center gap-2 p-8 text-inkmut">
            <Spinner /> {t("pdf_rendering")}
          </div>
        }
        error={<div className="p-8 text-sm text-danger">{t("pdf_load_error")}</div>}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              id={`pdf-page-${n}`}
              data-pdf-page={n}
              className="shadow-card rounded-sm bg-white"
            >
              <Page
                pageNumber={n}
                width={width}
                customTextRenderer={textRenderer(n) as any}
                renderAnnotationLayer={false}
                loading={<div style={{ width, height: width * 1.35 }} className="bg-white" />}
              />
            </div>
          ))}
        </div>
      </Document>
      )}

      {selMenu && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full flex rounded-lg shadow-lg overflow-hidden border border-line"
          style={{ left: selMenu.x, top: selMenu.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="flex items-center gap-1.5 bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-deep"
            onClick={runExplain}
          >
            <Sparkles className="h-3.5 w-3.5" /> {t("pdf_explain")}
          </button>
          <button
            className="flex items-center gap-1.5 bg-paper text-ink px-3 py-1.5 text-sm font-medium hover:bg-surface2"
            onClick={() => {
              const q = selMenu.text.slice(0, 220);
              setSelMenu(null);
              router.push(
                `/manuscripts/${ms.id}/related-research?q=${encodeURIComponent(q)}`
              );
            }}
          >
            <FileSearch className="h-3.5 w-3.5" /> {t("pdf_find_sources")}
          </button>
        </div>
      )}

      {explain && (
        <div className="fixed bottom-6 right-6 z-30 w-96 card p-4 border-brand/60">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
              <Sparkles className="h-4 w-4" /> {t("pdf_explanation")}
              <span className="badge badge-ai ml-1">AI</span>
            </div>
            <button onClick={() => setExplain(null)} className="text-inkmut hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          {explain.loading ? (
            <div className="flex items-center gap-2 text-sm text-inkmut mt-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("pdf_reading_context")}
            </div>
          ) : (
            <p className="text-sm leading-relaxed mt-2 text-ink/90 max-h-56 overflow-y-auto panel-scroll">
              {explain.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
