"use client";
/* Platform-wide superadmin dashboard: point-in-time stat cards only. No
   charts, no per-user drilldown here (that's the Users page) — just enough
   to answer "how big is the platform right now." */
import { useEffect, useState } from "react";
import { CreditCard, DollarSign, FileText, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface Overview {
  total_users: number;
  total_institutions: number;
  active_subscriptions: number;
  total_blog_posts: number;
  stripe_balance: number | null;
}

export default function SuperadminDashboard() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>("/superadmin/overview").then(setOverview).catch((e) => setError(e.message));
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

  const stats = overview
    ? [
        { label: t("superadmin_stat_users"), value: String(overview.total_users), icon: Users },
        { label: t("superadmin_stat_institutions"), value: String(overview.total_institutions), icon: GraduationCap },
        { label: t("superadmin_stat_subscriptions"), value: String(overview.active_subscriptions), icon: CreditCard },
        { label: t("superadmin_stat_blog_posts"), value: String(overview.total_blog_posts), icon: FileText },
        ...(overview.stripe_balance != null
          ? [{ label: t("superadmin_stat_balance"), value: `$${overview.stripe_balance.toFixed(2)}`, icon: DollarSign }]
          : []),
      ]
    : [];

  return (
    <GlobalShell>
      <div className="max-w-5xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("superadmin_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">{t("superadmin_subtitle")}</p>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {!overview && !error && <Spinner className="h-5 w-5 text-brand" />}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card p-4">
                <div className="flex items-center gap-2 text-inkmut">
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{s.label}</span>
                </div>
                <div className="font-serif text-2xl font-semibold mt-2">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </GlobalShell>
  );
}
