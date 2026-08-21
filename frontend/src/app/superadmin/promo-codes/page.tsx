"use client";
/* Promo codes, managed directly through Stripe (Coupon + PromotionCode) —
   no local table, matching how /billing/checkout already enables Stripe's
   own promotion-code field. */
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  max_redemptions: number | null;
  times_redeemed: number | null;
}

export default function SuperadminPromoCodesPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState("once");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const load = useCallback(() => {
    api<PromoCode[]>("/superadmin/promo-codes").then(setCodes).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api("/superadmin/promo-codes", {
        method: "POST",
        body: JSON.stringify({
          code,
          duration,
          percent_off: discountType === "percent" ? Number(value) : undefined,
          amount_off: discountType === "amount" ? Math.round(Number(value) * 100) : undefined,
          max_redemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        }),
      });
      setCode("");
      setValue("");
      setMaxRedemptions("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (c: PromoCode) => {
    setError(null);
    try {
      await api(`/superadmin/promo-codes/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !c.active }),
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

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
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("superadmin_promo_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">{t("superadmin_promo_subtitle")}</p>

        <form onSubmit={create} className="card p-4 flex flex-wrap items-end gap-2 mb-6">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("superadmin_promo_code_placeholder")}
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm w-36"
            required
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          >
            <option value="percent">{t("superadmin_promo_percent_off")}</option>
            <option value="amount">{t("superadmin_promo_amount_off")}</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("superadmin_promo_value_placeholder")}
            type="number"
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm w-24"
            required
          />
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          >
            <option value="once">{t("superadmin_promo_duration_once")}</option>
            <option value="repeating">{t("superadmin_promo_duration_repeating")}</option>
            <option value="forever">{t("superadmin_promo_duration_forever")}</option>
          </select>
          <input
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder={t("superadmin_promo_max_redemptions_placeholder")}
            type="number"
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm w-40"
          />
          <button type="submit" disabled={creating} className="btn btn-primary px-3 py-1.5">
            {creating ? <Spinner className="h-4 w-4" /> : t("superadmin_promo_create")}
          </button>
        </form>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {codes === null && <Spinner className="h-5 w-5 text-brand" />}
        {codes !== null && codes.length === 0 && (
          <div className="text-center py-16 text-inkmut text-sm">{t("superadmin_promo_empty")}</div>
        )}

        <div className="flex flex-col gap-2">
          {(codes || []).map((c) => (
            <div key={c.id} className="card p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-mono font-medium text-[14px]">{c.code}</div>
                <div className="text-xs text-inkmut mt-0.5">
                  {c.percent_off != null
                    ? `${c.percent_off}% off`
                    : c.amount_off != null
                    ? `${(c.amount_off / 100).toFixed(2)} ${(c.currency || "").toUpperCase()} off`
                    : ""}
                  {" · "}
                  {c.times_redeemed ?? 0}
                  {c.max_redemptions ? `/${c.max_redemptions}` : ""} {t("superadmin_promo_redeemed")}
                </div>
              </div>
              <span className={`badge ${c.active ? "" : "text-inkmut"}`}>{c.active ? "active" : "inactive"}</span>
              <button onClick={() => toggleActive(c)} className="btn btn-outline px-2.5 py-1.5 text-xs">
                {c.active ? t("superadmin_promo_deactivate") : t("superadmin_promo_activate")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlobalShell>
  );
}
