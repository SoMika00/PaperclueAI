"use client";
import { Suspense } from "react";
import GlobalShell from "@/components/GlobalShell";
import LiteratureSearch from "@/components/LiteratureSearch";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

export default function LiteraturePage() {
  const { t } = useLocale();
  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("discover_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">
          {t("discover_subtitle")}
        </p>
        <Suspense fallback={<Spinner />}>
          <LiteratureSearch />
        </Suspense>
      </div>
    </GlobalShell>
  );
}
