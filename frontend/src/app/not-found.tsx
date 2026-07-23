"use client";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen grid place-items-center bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink px-6 text-center transition-colors">
      <div>
        <Logo className="mx-auto block h-8 mb-6" />
        <div className="font-serif text-5xl font-semibold text-brand">404</div>
        <h1 className="font-serif text-xl font-semibold mt-3">{t("notfound_title")}</h1>
        <p className="text-sm text-inkmut dark:text-dark-inkmut mt-1.5 mb-6">
          {t("notfound_subtitle")}
        </p>
        <Link href="/" className="btn btn-primary">
          {t("notfound_back")}
        </Link>
      </div>
    </div>
  );
}
