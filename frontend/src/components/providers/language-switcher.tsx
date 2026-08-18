"use client";
/* Shim for the ported marketing navbar: toggles the redesign's locale context
   (which MarketingI18nProvider mirrors into i18next), so the ported components'
   t("…") calls switch language with the rest of the app. */
import { useLocale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, toggle } = useLocale();
  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {locale === "en" ? "日本語" : "English"}
    </button>
  );
}

export default LanguageSwitcher;
