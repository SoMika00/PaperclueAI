"use client";
/* Wraps premium-only content. Shows the content to subscribers; everyone else
   sees an upgrade prompt that routes to /upgrade. */
import Link from "next/link";
import { Lock } from "lucide-react";
import { usePremium } from "@/lib/entitlement";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/ui";

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const { active, loading } = usePremium();
  const { t } = useLocale();

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-inkmut">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (active) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-deep">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-ink dark:text-dark-ink">
        {t("premium_locked_title")}
      </h2>
      <p className="mt-2 text-sm text-inkmut dark:text-dark-inkmut leading-relaxed">
        {t("premium_locked_desc")}
      </p>
      <Link href="/upgrade" className="btn btn-primary mt-5 inline-flex px-5 py-2.5 text-[15px]">
        {t("premium_upgrade_cta")}
      </Link>
    </div>
  );
}
