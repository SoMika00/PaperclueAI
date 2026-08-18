"use client";
/* Shared shell for the public legal pages (privacy, terms). Same top bar as the
   landing (logo → home, theme + language toggles, Log in) + a readable prose
   column + the site footer. Content is passed in as structured sections so each
   page can supply EN/JA copy by locale without bloating the i18n dictionary. */
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

export interface LegalSection {
  heading: string;
  body: string[];
}

export default function LegalLayout({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen font-inter bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteNav />

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="font-inter text-3xl sm:text-4xl font-semibold">{title}</h1>
        <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-2">{updated}</p>
        <p className="text-[15px] leading-relaxed mt-6 text-slate-700 dark:text-slate-200">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-inter text-xl font-semibold">
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((p, j) => (
                <p
                  key={j}
                  className="text-[14.5px] leading-relaxed mt-3 text-slate-600 dark:text-slate-300"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6">
          <Link href="/" className="text-[13px] text-pcblue hover:underline">
            ← {t("legal_back_home")}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
