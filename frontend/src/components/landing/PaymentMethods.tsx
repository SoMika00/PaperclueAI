"use client";
/* Supported payment options — recreated from the original PaymentMethods.tsx.
   Stripe note + supported card brand logos. */
import { useLocale } from "@/lib/i18n";

const CARDS = [
  { name: "Visa", src: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/visa.svg" },
  { name: "Mastercard", src: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/mastercard.svg" },
  { name: "American Express", src: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/amex.svg" },
  { name: "Discover", src: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/discover.svg" },
  { name: "JCB", src: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/jcb.svg" },
];

export default function PaymentMethods() {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-3 my-8">
      <p className="text-center text-[14px] text-slate-600 dark:text-slate-300">
        {t("lp_pay_note")}
      </p>
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {CARDS.map((c) => (
          <img key={c.name} src={c.src} alt={c.name} className="h-7 w-auto" loading="lazy" />
        ))}
      </div>
    </div>
  );
}
