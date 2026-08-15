"use client";
/* Public marketing landing page — no auth required. All CTAs route to /login
   (this is a login-only app; there is no public signup). */
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import HeroCarousel from "@/components/landing/HeroCarousel";
import FeatureBlock from "@/components/landing/FeatureBlock";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FaqAccordion from "@/components/landing/FaqAccordion";
import ContactSection from "@/components/landing/ContactSection";
import SiteFooter from "@/components/landing/SiteFooter";

const RES_MIRROR_FEATURES: { titleKey: DictKey; descKey: DictKey }[] = [
  { titleKey: "lp_rm_f1_title", descKey: "lp_rm_f1_desc" },
  { titleKey: "lp_rm_f2_title", descKey: "lp_rm_f2_desc" },
  { titleKey: "lp_rm_f3_title", descKey: "lp_rm_f3_desc" },
  { titleKey: "lp_rm_f4_title", descKey: "lp_rm_f4_desc" },
  { titleKey: "lp_rm_f5_title", descKey: "lp_rm_f5_desc" },
  { titleKey: "lp_rm_f6_title", descKey: "lp_rm_f6_desc" },
];

const MIND_MAP_FEATURES: { titleKey: DictKey; descKey: DictKey }[] = [
  { titleKey: "lp_mm_f1_title", descKey: "lp_mm_f1_desc" },
  { titleKey: "lp_mm_f2_title", descKey: "lp_mm_f2_desc" },
  { titleKey: "lp_mm_f3_title", descKey: "lp_mm_f3_desc" },
  { titleKey: "lp_mm_f4_title", descKey: "lp_mm_f4_desc" },
  { titleKey: "lp_mm_f5_title", descKey: "lp_mm_f5_desc" },
  { titleKey: "lp_mm_f6_title", descKey: "lp_mm_f6_desc" },
];

export default function LandingPage() {
  const { t, locale, toggle } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line dark:border-dark-line bg-ivory/80 dark:bg-dark-bg/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-[15px] max-w-[1400px] mx-auto">
          <img src="/paperclue-logo.png" alt="PaperClue" className="h-8 w-auto" />
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

      {/* Hero carousel */}
      <HeroCarousel />

      {/* How it works */}
      <section id="features" className="w-full max-w-[1400px] mx-auto px-6 py-20">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-center mb-14">
          {t("lp_how_title")}
        </h2>
        <FeatureBlock
          titleKey="lp_rm_title"
          descKey="lp_rm_desc"
          features={RES_MIRROR_FEATURES}
          ctaKey="lp_rm_cta"
          image="/img/citation_checker.png"
          imageAlt="Research Refiner"
        />
        <FeatureBlock
          titleKey="lp_mm_title"
          descKey="lp_mm_desc"
          features={MIND_MAP_FEATURES}
          ctaKey="lp_mm_cta"
          image="/img/mindmap.png"
          imageAlt="Mind Map"
          reversed
        />
      </section>

      {/* Comparison */}
      <ComparisonTable />

      {/* FAQ */}
      <FaqAccordion />

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
