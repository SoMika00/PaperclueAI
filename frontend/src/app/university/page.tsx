"use client";
/* University Repository: the tenant's private corpus. Read-only; never leaves
   the tenant. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { api } from "@/lib/api";
import GlobalShell from "@/components/GlobalShell";
import { ScopeBadge, Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface UniPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  collection: string;
}

export default function UniversityPage() {
  const { t } = useLocale();
  const [papers, setPapers] = useState<UniPaper[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api<UniPaper[]>(`/university${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then(setPapers)
        .catch(() => setPapers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const collections = Array.from(new Set((papers || []).map((p) => p.collection)));

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-uni" />
          <h1 className="font-serif text-2xl font-semibold">{t("university_title")}</h1>
        </div>
        <p className="text-sm text-inkmut mt-0.5 mb-5">
          {t("university_subtitle")}
        </p>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmut" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("university_search_placeholder")}
            className="w-full rounded-lg border border-line bg-paper pl-9 pr-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        {papers === null && <Spinner className="h-5 w-5 text-brand" />}
        {papers !== null && papers.length === 0 && (
          <div className="text-sm text-inkmut py-8">{t("university_empty")}</div>
        )}

        {collections.map((c) => (
          <section key={c} className="mb-6">
            <h2 className="section-title mb-1">{c}</h2>
            <div className="flex flex-col divide-y divide-line/70">
              {(papers || [])
                .filter((p) => p.collection === c)
                .map((p) => (
                  <Link key={p.id} href={`/university/${p.id}`} className="block py-3 -mx-2 px-2 rounded hover:bg-surface2/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <ScopeBadge scope="university" />
                      {p.year && <span className="text-[11px] text-inkmut">{p.year}</span>}
                      {p.venue && (
                        <span className="text-[11px] text-inkmut truncate">{p.venue}</span>
                      )}
                    </div>
                    <div className="font-medium text-[14px] leading-snug mt-1">{p.title}</div>
                    <div className="text-xs text-inkmut mt-0.5">
                      {(p.authors || []).slice(0, 5).join(", ")}
                    </div>
                    {p.abstract && (
                      <p className="text-xs text-inkmut leading-snug mt-1 line-clamp-2">
                        {p.abstract}
                      </p>
                    )}
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </GlobalShell>
  );
}
