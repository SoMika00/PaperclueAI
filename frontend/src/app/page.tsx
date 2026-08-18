"use client";
/* Public marketing landing page — no auth required. Faithful recreation of the
   original paperclue.ai home, rebuilt in the redesign design system. All CTAs
   route to /login (this is a login-only app; there is no public signup). */
import { useLocale, type DictKey } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import HeroCarousel from "@/components/landing/HeroCarousel";
import FeatureBlock from "@/components/landing/FeatureBlock";
import ComparisonTable from "@/components/landing/ComparisonTable";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
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

// Cloudinary demo videos (autoplay/muted/loop when scrolled into view)
const PROOFREADER_VIDEO =
  "https://res.cloudinary.com/di98mpcja/video/upload/v1756089401/proofreader_vrusej.mp4";
const MINDMAP_VIDEO =
  "https://res.cloudinary.com/di98mpcja/video/upload/v1756089454/mind_map_qzbdeb.mp4";

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen font-inter bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteNav />

      {/* Hero carousel */}
      <HeroCarousel />

      {/* How it works */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <h2 className="font-inter text-3xl sm:text-4xl font-semibold text-center mb-14">
          {t("lp_how_title")}
        </h2>
        <FeatureBlock
          titleKey="lp_rm_title"
          descKey="lp_rm_desc"
          features={RES_MIRROR_FEATURES}
          ctaKey="lp_rm_cta"
          video={PROOFREADER_VIDEO}
          image="/img/citation_checker.png"
          imageAlt="Research Refiner demo"
        />
        <FeatureBlock
          titleKey="lp_mm_title"
          descKey="lp_mm_desc"
          features={MIND_MAP_FEATURES}
          ctaKey="lp_mm_cta"
          video={MINDMAP_VIDEO}
          image="/img/mindmap.png"
          imageAlt="Mind Map demo"
          reversed
        />
      </section>

      {/* Comparison */}
      <ComparisonTable />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* FAQ */}
      <FaqAccordion />

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
