"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import GlobalShell from "@/components/GlobalShell";
import { api } from "@/lib/api";
import { usePremium } from "@/lib/entitlement";
import { useLocale } from "@/lib/i18n";

type Plan = "premium" | "pro" | "team";

export default function UpgradePage() {
  const { t } = useLocale();
  const { active, plan, refresh } = usePremium();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Read the post-checkout result without useSearchParams (keeps `next build`
  // from requiring a Suspense boundary).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("checkout");
    if (q === "success") {
      setNotice(t("upgrade_success"));
      refresh();
    } else if (q === "cancel") {
      setNotice(t("upgrade_canceled"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = async (p: Plan) => {
    setBusy(p);
    setError(null);
    try {
      const r = await api<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: p }),
      });
      window.location.href = r.url;
    } catch (e: any) {
      const msg = e?.message || "";
      setError(/503|not configured/i.test(msg) ? t("upgrade_not_configured") : t("upgrade_failed"));
      setBusy(null);
    }
  };

  const manage = async () => {
    setBusy("portal");
    setError(null);
    try {
      const r = await api<{ url: string }>("/billing/portal", { method: "POST" });
      window.location.href = r.url;
    } catch {
      setError(t("upgrade_failed"));
      setBusy(null);
    }
  };

  const FEATURES = [
    t("upgrade_feat_tools"),
    t("upgrade_feat_review"),
    t("upgrade_feat_journal"),
    t("upgrade_feat_mindmap"),
  ];

  // Three named tiers; any active tier unlocks all premium features. Each card
  // shows the shared features plus a one-line "best for" note and any extra.
  const PLANS: {
    id: Plan; name: string; price: string; caption: string; blurb: string; extra?: string; popular?: boolean;
  }[] = [
    { id: "premium", name: t("tier_premium"), price: "¥2,200", caption: t("plan_monthly_caption"),
      blurb: t("tier_premium_blurb") },
    { id: "pro", name: t("tier_pro"), price: "¥5,500", caption: t("plan_monthly_caption"),
      blurb: t("tier_pro_blurb"), extra: t("tier_pro_extra"), popular: true },
    { id: "team", name: t("tier_team"), price: "¥22,000", caption: t("plan_monthly_caption"),
      blurb: t("tier_team_blurb"), extra: t("tier_team_extra") },
  ];

  return (
    <GlobalShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft text-brand-deep px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> {t("upgrade_badge")}
          </span>
          <h1 className="font-serif text-[28px] font-semibold text-ink dark:text-dark-ink mt-3">
            {t("upgrade_title")}
          </h1>
          <p className="text-[14px] text-inkmut dark:text-dark-inkmut mt-2 max-w-xl mx-auto leading-relaxed">
            {t("upgrade_subtitle")}
          </p>
        </div>

        {notice && (
          <div className="mt-6 rounded-xl border border-manuscript/40 bg-manuscript-soft px-4 py-3 text-sm text-ink text-center">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger text-center">
            {error}
          </div>
        )}

        {active ? (
          <div className="mt-8 rounded-2xl border border-line bg-paper dark:bg-dark-surface dark:border-dark-line p-6 text-center shadow-card">
            <div className="inline-flex items-center gap-2 text-manuscript font-semibold">
              <Check className="h-5 w-5" /> {t("upgrade_current")} {plan ? `· ${plan}` : ""}
            </div>
            <p className="text-sm text-inkmut dark:text-dark-inkmut mt-2">{t("upgrade_current_desc")}</p>
            <button onClick={manage} disabled={!!busy} className="btn btn-outline mt-4 inline-flex px-5 py-2.5">
              {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("upgrade_manage")}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl border bg-paper dark:bg-dark-surface p-6 shadow-card flex flex-col ${
                  p.popular ? "border-brand ring-1 ring-brand/40" : "border-line dark:border-dark-line"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand text-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {t("tier_popular")}
                  </span>
                )}
                <div className="text-sm font-semibold text-ink dark:text-dark-ink">{p.name}</div>
                <div className="text-[11px] text-inkmut dark:text-dark-inkmut mt-0.5 leading-snug">{p.blurb}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-ink dark:text-dark-ink">{p.price}</span>
                  <span className="text-xs text-inkmut dark:text-dark-inkmut">{p.caption}</span>
                </div>
                <ul className="mt-4 space-y-2 flex-1">
                  {[...FEATURES, ...(p.extra ? [p.extra] : [])].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] text-ink/85 dark:text-dark-ink">
                      <Check className="h-4 w-4 text-manuscript shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribe(p.id)}
                  disabled={!!busy}
                  className={`mt-5 w-full justify-center py-2.5 text-[15px] btn ${p.popular ? "btn-primary" : "btn-outline"}`}
                >
                  {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("upgrade_subscribe")}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-inkmut dark:text-dark-inkmut mt-6">
          {t("upgrade_promo_hint")}
        </p>
      </div>
    </GlobalShell>
  );
}
