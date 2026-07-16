"use client";
/* Library: your saved papers. Click one to open its focus page (public papers
   get live metadata; university papers open in the repository). */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { SavedPaper } from "@/lib/types";
import GlobalShell from "@/components/GlobalShell";
import { ScopeBadge, Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

export default function LibraryPage() {
  const { t } = useLocale();
  const [papers, setPapers] = useState<SavedPaper[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<SavedPaper[]>("/library").then(setPapers).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await api(`/library/${id}`, { method: "DELETE" });
    load();
  };

  const collections = Array.from(new Set((papers || []).map((p) => p.collection)));

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("library_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">
          {t("library_subtitle")}
        </p>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {papers === null && <Spinner className="h-5 w-5 text-brand" />}
        {papers !== null && papers.length === 0 && (
          <div className="text-center py-16 text-inkmut">
            <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <div className="text-sm">
              {t("library_empty")} <strong>{t("library_empty_bold")}</strong> {t("library_empty_end")}
            </div>
          </div>
        )}

        {collections.map((c) => (
          <section key={c} className="mb-6">
            <h2 className="section-title mb-1">{c}</h2>
            <div className="flex flex-col divide-y divide-line/70">
              {(papers || [])
                .filter((p) => p.collection === c)
                .map((p) => (
                  <div
                    key={p.id}
                    className="group flex gap-3 py-3 -mx-2 px-2 rounded hover:bg-surface2/60 transition-colors"
                  >
                    <Link
                      href={
                        p.source_scope === "university"
                          ? `/university/${p.corpus_id}`
                          : `/library/${p.id}`
                      }
                      className="flex-1 min-w-0 block"
                    >
                      <div className="flex items-center gap-2">
                        <ScopeBadge scope={p.source_scope} />
                        {p.year && <span className="text-[11px] text-inkmut">{p.year}</span>}
                        {p.venue && (
                          <span className="text-[11px] text-inkmut truncate">
                            {p.venue.slice(0, 50)}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-[14px] leading-snug mt-1 group-hover:text-brand-deep">
                        {p.title}
                      </div>
                      <div className="text-xs text-inkmut mt-0.5 truncate">
                        {(p.authors || []).slice(0, 4).join(", ")}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => remove(e, p.id)}
                      className="btn btn-ghost p-1.5 self-start opacity-0 group-hover:opacity-100 hover:text-danger"
                      title="Remove from library"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </GlobalShell>
  );
}
