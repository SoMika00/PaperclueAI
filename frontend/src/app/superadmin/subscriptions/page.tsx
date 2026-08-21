"use client";
/* Read-only billing overview: counts from the local Subscription table plus
   one live Stripe balance figure. No plan editor, no per-subscriber actions
   here — that's Stripe's own dashboard's job. */
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface Overview {
  by_status: Record<string, number>;
  by_plan: Record<string, number>;
  stripe_balance: number | null;
}

interface RecentSub {
  user_id: string;
  status: string;
  plan: string | null;
  updated_at: string | null;
  email: string | null;
  full_name: string | null;
}

export default function SuperadminSubscriptionsPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<RecentSub[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>("/superadmin/subscriptions/overview").then(setOverview).catch((e) => setError(e.message));
    api<RecentSub[]>("/superadmin/subscriptions/recent").then(setRecent).catch((e) => setError(e.message));
  }, []);

  if (ready && profile && profile.role !== "platform_admin") {
    return (
      <GlobalShell>
        <div className="max-w-3xl mx-auto px-8 py-16 text-center text-inkmut">
          <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-40" />
          {t("superadmin_only")}
        </div>
      </GlobalShell>
    );
  }

  return (
    <GlobalShell>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("superadmin_subs_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">{t("superadmin_subs_subtitle")}</p>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {!overview && !error && <Spinner className="h-5 w-5 text-brand" />}

        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(overview.by_status).map(([status, count]) => (
              <div key={status} className="card p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-inkmut">{status}</div>
                <div className="font-serif text-2xl font-semibold mt-2">{count}</div>
              </div>
            ))}
            {overview.stripe_balance != null && (
              <div className="card p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-inkmut">
                  {t("superadmin_subs_balance")}
                </div>
                <div className="font-serif text-2xl font-semibold mt-2">
                  ${overview.stripe_balance.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 className="section-title mb-2">{t("superadmin_subs_recent")}</h2>
        {recent !== null && recent.length === 0 && (
          <div className="text-center py-16 text-inkmut text-sm">{t("superadmin_subs_empty")}</div>
        )}
        <div className="flex flex-col gap-2">
          {(recent || []).map((s) => (
            <div key={s.user_id} className="card p-3 flex items-center gap-3 text-sm">
              <div className="flex-1 min-w-0 truncate">{s.full_name || s.email || s.user_id}</div>
              <span className="badge">{s.plan || "—"}</span>
              <span className="badge">{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </GlobalShell>
  );
}
