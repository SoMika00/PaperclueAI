"use client";
/* Shared shell for the public legal pages (privacy, terms). Same top bar as the
   landing (logo → home, theme + language toggles, Log in) + a readable prose
   column + the site footer. Content is passed in as structured sections so each
   page can supply EN/JA copy by locale without bloating the i18n dictionary. */
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
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
  const { t, locale, toggle } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      {/* Top bar (mirrors the landing) */}
      <header className="sticky top-0 z-30 border-b border-line dark:border-dark-line bg-ivory/80 dark:bg-dark-bg/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-[15px] max-w-6xl mx-auto">
          <Link href="/">
            <img src="/paperclue-logo.png" alt="PaperClue" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={toggle}
              className="text-xs font-semibold text-inkmut dark:text-dark-inkmut hover:text-ink dark:hover:text-dark-ink"
            >
              {locale === "en" ? "日本語" : "English"}
            </button>
            <Link href="/login" className="btn btn-primary">
              {t("landing_login_button")}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{title}</h1>
        <p className="text-[13px] text-inkmut dark:text-dark-inkmut mt-2">{updated}</p>
        <p className="text-[15px] leading-relaxed mt-6 text-ink/90 dark:text-dark-ink">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-serif text-xl font-semibold">
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((p, j) => (
                <p
                  key={j}
                  className="text-[14.5px] leading-relaxed mt-3 text-inkmut dark:text-dark-inkmut"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-line dark:border-dark-line pt-6">
          <Link href="/" className="text-[13px] text-brand-deep hover:underline">
            ← {t("legal_back_home")}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
