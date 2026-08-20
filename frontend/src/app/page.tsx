"use client";
/* Public marketing landing page — a VERBATIM port of the original paperclue.ai
   home (src/app/(authorized)/page.tsx there): same sections, same order, same
   copy (via the original locale JSON), and the original components with their
   own theme. Everything is wrapped in `pc-marketing` so that theme's CSS
   variables and Inter font apply here only — the logged-in app keeps the
   navy/orange design system. Login-only app: feature CTAs route to /login. */
import { useState } from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import MarketingI18nProvider from "@/lib/i18n-marketing";
import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureSection } from "@/components/marketing/feature-section";
import { ComparisonSection } from "@/components/marketing/comparison-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { ContactSection } from "@/components/marketing/contact-section";
import { Footer } from "@/components/marketing/footer";

function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* How it Works Section */}
      <section
        className="pt-16 bg-white/90 dark:bg-[#0f1727] backdrop-blur-sm"
        id="features"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">
            {t("home.features.title")}
          </h2>
          {/* Research Mirror Feature */}
          <FeatureSection
            title={t("home.features.resMirror.title")}
            description={t("home.features.resMirror.description")}
            features={[1, 2, 3, 4, 5, 6].map((n) => ({
              title: t(`home.features.resMirror.feature${n}`),
              description: t(
                `home.features.resMirror.featureDescriptions.feature${n}`
              ),
            }))}
            ctaText={t("home.features.resMirror.cta")}
            ctaLink="/login"
          />
          {/* Mind Map Feature */}
          <FeatureSection
            title={t("home.features.mindMap.title")}
            description={t("home.features.mindMap.description")}
            features={[1, 2, 3, 4, 5, 6].map((n) => ({
              title: t(`home.features.mindMap.feature${n}`),
              description: t(
                `home.features.mindMap.featureDescriptions.feature${n}`
              ),
            }))}
            ctaText={t("home.features.mindMap.cta")}
            ctaLink="/login"
          />
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  // The ported navbar uses react-query; give the marketing tree its own client.
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <MarketingI18nProvider>
        <div className="pc-marketing">
          <Home />
          <Toaster position="top-center" />
        </div>
      </MarketingI18nProvider>
    </QueryClientProvider>
  );
}
