"use client";
/* Focus page for a saved (public) paper: stored metadata enriched live from
   Semantic Scholar (citations, TLDR), plus the bridge actions. */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FileSearch,
  FileText,
  MessageSquare,
  Network,
  Quote,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import GlobalShell from "@/components/GlobalShell";
import PaperQuickActions, { FocusDestination } from "@/components/PaperQuickActions";
import { ScopeBadge, Spinner } from "@/components/ui";

interface SavedDetail {
  id: string;
  corpus_id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  abstract: string;
  url: string | null;
  source_scope: any;
  collection: string;
  citation_count?: number | null;
  tldr?: string | null;
  open_access_pdf_url?: string | null;
}

export default function SavedPaperPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [paper, setPaper] = useState<SavedDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const openInFocus = async (destination: string = "overview") => {
    if (!paper || importing) return;
    setImporting(destination);
    setImportError(null);
    try {
      const r = await api<{ manuscript_id: string }>("/import", {
        method: "POST",
        body: JSON.stringify({ kind: "library", id: paper.id }),
      });
      router.push(`/manuscripts/${r.manuscript_id}/${destination}`);
    } catch (e: any) {
      setImportError(
        e.message?.includes("open-access")
          ? "No open-access full text available — Focus needs the PDF."
          : e.message?.slice(0, 140) || "Import failed"
      );
      setImporting(null);
    }
  };

  useEffect(() => {
    api<SavedDetail>(`/library/${params.id}`)
      .then(setPaper)
      .catch((e) => setError(e.message));
  }, [params.id]);

  const mapIt = async () => {
    if (!paper || mapping) return;
    setMapping(true);
    try {
      const { id } = await api<{ id: string }>("/mindmaps", {
        method: "POST",
        body: JSON.stringify({
          seed_type: "question",
          question: paper.title,
          title: `Around: ${paper.title.slice(0, 100)}`,
        }),
      });
      router.push(`/mind-maps/${id}`);
    } catch {
      setMapping(false);
    }
  };

  const remove = async () => {
    if (!paper) return;
    await api(`/library/${paper.id}`, { method: "DELETE" });
    router.push("/library");
  };

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <Link
          href="/library"
          className="flex items-center gap-1 text-sm text-inkmut hover:text-ink mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Library
        </Link>

        {error && <div className="card p-4 text-sm text-danger">{error}</div>}
        {!paper && !error && <Spinner className="h-5 w-5 text-brand" />}

        {paper && (
          <article>
            <div className="flex items-center gap-2 flex-wrap">
              <ScopeBadge scope={paper.source_scope} />
              {paper.year && <span className="text-xs text-inkmut">{paper.year}</span>}
              {paper.venue && (
                <span className="text-xs text-inkmut truncate">· {paper.venue}</span>
              )}
              {paper.citation_count != null && (
                <span className="inline-flex items-center gap-1 text-xs text-inkmut">
                  <Quote className="h-3 w-3" /> {paper.citation_count.toLocaleString()}{" "}
                  citations
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-semibold leading-snug mt-3">
              {paper.title}
            </h1>
            <div className="text-sm text-inkmut mt-2">
              {(paper.authors || []).join(", ")}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => openInFocus()} disabled={!!importing} className="btn btn-primary">
                {importing === "overview" ? <Spinner className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {importing === "overview" ? "Fetching full text…" : "Open in Focus"}
              </button>
              <button onClick={() => openInFocus("chat")} disabled={!!importing} className="btn btn-outline">
                <MessageSquare className="h-4 w-4" /> Chat with paper
              </button>
              {paper.url && (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <ExternalLink className="h-4 w-4" /> Open on Semantic Scholar
                </a>
              )}
              {paper.open_access_pdf_url && (
                <a
                  href={paper.open_access_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Open-access PDF
                </a>
              )}
              <button onClick={mapIt} disabled={mapping} className="btn btn-outline">
                {mapping ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                Map the literature around it
              </button>
              <Link
                href={`/discover?q=${encodeURIComponent(paper.title.slice(0, 180))}`}
                className="btn btn-outline"
              >
                <FileSearch className="h-4 w-4" /> Find related work
              </Link>
              <button onClick={remove} className="btn btn-ghost hover:text-danger">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>

            <PaperQuickActions
              onOpen={(destination: FocusDestination) => openInFocus(destination)}
              disabled={!!importing}
              active={importing}
            />

            {importError && (
              <div className="mt-3 text-xs text-warn bg-uni-soft/60 border border-uni/40 rounded-lg px-3 py-2 inline-block">
                {importError}
              </div>
            )}

            {paper.tldr && (
              <section className="mt-7 card p-4 bg-brand-soft/40 border-brand/30">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-brand-deep mb-1">
                  TL;DR (Semantic Scholar)
                </h2>
                <p className="text-sm leading-relaxed text-ink">{paper.tldr}</p>
              </section>
            )}

            <section className="mt-6">
              <h2 className="section-title mb-2">Abstract</h2>
              <p className="text-[15px] leading-relaxed text-ink whitespace-pre-line">
                {paper.abstract || "No abstract stored for this paper."}
              </p>
            </section>
          </article>
        )}
      </div>
    </GlobalShell>
  );
}
