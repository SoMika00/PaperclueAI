"use client";
/* Shared public marketing navbar — landing + all marketing/legal pages.
   Logo → /, nav links (About, Pricing, Blog), theme toggle, language toggle,
   and a "Log in" button. This is a login-only app: there is no public signup. */
import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const NAV_LINKS: { key: DictKey; href: string }[] = [
  { key: "lp_nav_about", href: "/about-us" },
  { key: "lp_nav_pricing", href: "/pricing" },
  { key: "lp_nav_blog", href: "/blog" },
];

export default function SiteNav() {
  const { t, locale, toggle } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line dark:border-dark-line bg-ivory/80 dark:bg-dark-bg/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-[15px] max-w-6xl mx-auto">
        <Link href="/" aria-label="PaperClue home">
          <img src="/paperclue-logo.png" alt="PaperClue" className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-inkmut dark:text-dark-inkmut transition-colors hover:text-brand-deep"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

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
          <Link href="/login" className="btn btn-primary hidden sm:inline-flex">
            {t("landing_login_button")}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-line dark:border-dark-line bg-ivory dark:bg-dark-bg">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-inkmut dark:text-dark-inkmut hover:bg-surface2 dark:hover:bg-dark-surface2 hover:text-brand-deep"
              >
                {t(l.key)}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn btn-primary justify-center mt-1"
            >
              {t("landing_login_button")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
