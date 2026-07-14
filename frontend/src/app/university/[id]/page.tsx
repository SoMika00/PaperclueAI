"use client";
/* Focus page for a university paper: full metadata + abstract, with the
   bridge actions (add to my research, find related, map it). */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FileSearch,
  Network,
} from "lucide-react";
import { api } from "@/lib/api";
import GlobalShell from "@/components/GlobalShell";
import { ScopeBadge, Spinner } from "@/components/ui";

interface UniPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  s2_id: string | null;
  collection: string;
}

export default function UniversityPaperPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [paper, setPaper] = useState<UniPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapping, setMapping] = useState(false);

  useEffect(() => {
    api<UniPaper>(`/university/${params.id}`)
      .then(setPaper)
      .catch((e) => setError(e.message));
  }, [params.id]);

  const save = async () => {
    if (!paper || saved) return;
    await api("/library", {
      method: "POST",
      body: JSON.stringify({
        corpus_id: paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        venue: paper.venue,
        abstract: paper.abstract.slice(0, 1500),
        url: null,
        source_scope: "university",
      }),
    });
    setSaved(true);
  };

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

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <Link
          href="/university"
          className="flex items-center gap-1 text-sm text-inkmut hover:text-ink mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> University Repository
        </Link>

        {error && <div className="card p-4 text-sm text-danger">{error}</div>}
        {!paper && !error && <Spinner className="h-5 w-5 text-brand" />}

        {paper && (
          <article>
            <div className="flex items-center gap-2 flex-wrap">
              <ScopeBadge scope="university" />
              <span className="text-xs text-inkmut">{paper.collection}</span>
              {paper.year && <span className="text-xs text-inkmut">· {paper.year}</span>}
              {paper.venue && (
                <span className="text-xs text-inkmut truncate">· {paper.venue}</span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-semibold leading-snug mt-3">
              {paper.title}
            </h1>
            <div className="text-sm text-inkmut mt-2">
              {(paper.authors || []).join(", ")}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={save} disabled={saved} className="btn btn-primary">
                {saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" /> In your library
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Add to my research
                  </>
                )}
              </button>
              <Link
                href={`/discover?q=${encodeURIComponent(paper.title.slice(0, 180))}`}
                className="btn btn-outline"
              >
                <FileSearch className="h-4 w-4" /> Find related work
              </Link>
              <button onClick={mapIt} disabled={mapping} className="btn btn-outline">
                {mapping ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                Map the literature around it
              </button>
              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  <ExternalLink className="h-4 w-4" /> DOI
                </a>
              )}
            </div>

            <section className="mt-7">
              <h2 className="section-title mb-2">Abstract</h2>
              <p className="text-[15px] leading-relaxed text-ink whitespace-pre-line">
                {paper.abstract || "No abstract available."}
              </p>
            </section>

            <p className="text-[11px] text-inkmut mt-8 border-t border-line pt-3">
              Institutional document — private to your tenant, searchable in Discover
              under the University scope, never sent to public engines.
            </p>
          </article>
        )}
      </div>
    </GlobalShell>
  );
}
