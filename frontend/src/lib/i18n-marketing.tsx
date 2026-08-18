"use client";
/* i18next for the ported marketing pages.

   The public landing/marketing pages are a verbatim port of the original
   paperclue.ai site, whose components call react-i18next's `useTranslation()`
   with dot-notation keys (t("home.features.title")). Rather than rewriting
   those components, we initialise i18next here with the original locale JSON
   and keep its language in sync with the redesign's own locale context. The
   logged-in app keeps using @/lib/i18n (useLocale/t) as before. */
import { useEffect } from "react";
import i18next from "i18next";
import { I18nextProvider } from "react-i18next";
import { useLocale } from "@/lib/i18n";
import en from "@/locales/en.json";
import ja from "@/locales/ja.json";

if (!i18next.isInitialized) {
  i18next.init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default function MarketingI18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    if (i18next.language !== locale) i18next.changeLanguage(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
