"use client";
/* Public landing page — no auth required. The Login button routes to /home,
   which stays gated by SignInGate and shows the sign-in form there. */
import Link from "next/link";
import {
  ClipboardCheck,
  FileOutput,
  Network,
  Sparkles,
  SpellCheck2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";
import HeroMap from "@/components/HeroMap";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

const FEATURES = [
  { icon: Network, titleKey: "landing_feat_mindmap_title", descKey: "landing_feat_mindmap_desc" },
  { icon: Sparkles, titleKey: "landing_feat_insight_title", descKey: "landing_feat_insight_desc" },
  { icon: ClipboardCheck, titleKey: "landing_feat_review_title", descKey: "landing_feat_review_desc" },
  { icon: SpellCheck2, titleKey: "landing_feat_proofreading_title", descKey: "landing_feat_proofreading_desc" },
  { icon: FileOutput, titleKey: "landing_feat_journal_title", descKey: "landing_feat_journal_desc" },
];

const COMPARE_ROWS = [1, 2, 3, 4, 5];

export default function LandingPage() {
  const { t, locale, toggle } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      {/* Top bar */}
      <header className="border-b border-line dark:border-dark-line bg-ivory/80 dark:bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-[19px] max-w-[1400px] mx-auto">
        <Logo className="h-8" />
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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left lg:pl-2">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-uni bg-uni-soft border border-uni/40 rounded-full px-3 py-1 mb-5">
            {t("landing_demo_badge")}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            {t("landing_hero_title")}
          </h1>
          <p className="text-inkmut dark:text-dark-inkmut mt-5 text-[15px] leading-relaxed">
            {t("landing_hero_subtitle")}
          </p>
          <Link href="/login" className="btn btn-primary mt-8 inline-flex px-6 py-2.5 text-[15px]">
            {t("landing_hero_cta")}
          </Link>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroMap />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="section-title text-center mb-8">{t("landing_how_it_works")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.titleKey} className="card p-5">
                <Icon className="h-5 w-5 text-brand" />
                <div className="font-semibold mt-3 text-[15px]">{t(f.titleKey as any)}</div>
                <p className="text-[13px] text-inkmut dark:text-dark-inkmut mt-1.5 leading-relaxed">
                  {t(f.descKey as any)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="font-serif text-2xl font-semibold text-center">
          {t("landing_compare_title")}
        </h2>
        <p className="text-inkmut dark:text-dark-inkmut text-center mt-2 mb-8 text-sm max-w-xl mx-auto">
          {t("landing_compare_subtitle")}
        </p>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line dark:border-dark-line text-left">
                <th className="px-4 py-3 font-semibold">{t("landing_compare_feature")}</th>
                <th className="px-4 py-3 font-semibold text-inkmut dark:text-dark-inkmut">{t("landing_compare_generic")}</th>
                <th className="px-4 py-3 font-semibold text-brand-deep">{t("landing_compare_paperclue")}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((n) => (
                <tr key={n} className="border-b border-line/60 dark:border-dark-line/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{t(`landing_compare_row${n}_feat` as any)}</td>
                  <td className="px-4 py-3 text-inkmut dark:text-dark-inkmut">{t(`landing_compare_row${n}_generic` as any)}</td>
                  <td className="px-4 py-3 text-manuscript">{t(`landing_compare_row${n}_pc` as any)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line dark:border-dark-line py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-5 opacity-80" />
            <span className="text-xs text-inkmut dark:text-dark-inkmut">{t("landing_footer_tagline")}</span>
          </div>
          <Link href="/login" className="text-xs text-brand-deep hover:underline">
            {t("landing_login_button")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
