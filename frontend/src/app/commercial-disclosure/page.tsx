"use client";
/* Public 特定商取引法 / Commercial Disclosure page. Faithful recreation of the
   original, rebuilt in the redesign design system. Bilingual by locale. */
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

type Row = { label: string; value?: string; points?: string[] };

const CONTENT: { en: { title: string; rows: Row[] }; ja: { title: string; rows: Row[] } } = {
  en: {
    title: "Legal Notice under the Specified Commercial Transactions Act",
    rows: [
      { label: "Legal Name", value: "Paper Clue Inc." },
      { label: "Address", value: "7-45 Saijo Asahimachi, Higashihiroshima City, Hiroshima Prefecture, 739-0012, Japan" },
      { label: "Cooperate Number", value: "5420001064890" },
      { label: "Phone number", value: "+81-70-9315-6622" },
      { label: "Business Hours", value: "9:00–17:00 (excluding weekends and public holidays)" },
      { label: "Email address", value: "contact@paperclue.ai" },
      { label: "Head of Operations", value: "Nisar Ahmad Taliman" },
      { label: "Price", value: "The price for each plan is displayed on the pricing table provided on our service pages." },
      { label: "Additional fees", value: "No shipping fees, transaction fees, or administrative fees are charged." },
      { label: "Accepted payment methods", value: "Credit card, debit card, or domestic bank transfer." },
      {
        label: "Payment Timing",
        points: [
          "Payments by credit card or debit card are processed immediately.",
          "For bank transfers, please remit payment within three (3) days of placing your order.",
        ],
      },
      {
        label: "Refund Policy",
        points: [
          "Subscription fees (monthly or annual) are non-refundable, including in cases of unused subscription periods or early cancellation.",
          "Subscriptions automatically renew at the end of each billing cycle unless canceled in advance.",
          "Subscribers may cancel at any time via their account settings. Access to the service will continue until the end of the current billing cycle.",
        ],
      },
    ],
  },
  ja: {
    title: "特定商取引法に基づく表記",
    rows: [
      { label: "販売業者", value: "Paper Clue 株式会社" },
      { label: "所在地", value: "〒739-0012 広島県東広島市西条朝日町7-45" },
      { label: "法人番号", value: "5420001064890" },
      { label: "電話番号", value: "070-9315-6622" },
      { label: "営業時間", value: "09:00 - 17:00 (土日祝日を除く)" },
      { label: "メールアドレス", value: "contact@paperclue.ai" },
      { label: "運営統括責任者", value: "Nisar Ahmad Taliman　（ニサール・アフマド・タリマン）" },
      { label: "販売価格", value: "サービスページ等の料金表にて、プラン毎に表示される金額" },
      { label: "商品代金以外の必要料金", value: "送料、取引手数料、事務手数料はかかりません。" },
      { label: "お支払い方法", value: "クレジットカード、デビットカード、または国内銀行振込" },
      {
        label: "お支払い時期",
        points: [
          "クレジットカードまたはデビットカードでのお支払いは即時に処理されます。",
          "銀行振込の場合は、ご注文日から3日以内にお振込みください。",
        ],
      },
      {
        label: "返金ポリシー",
        points: [
          "月額および年額の購読料は、未使用期間や早期解約の場合を含め、返金はできません。",
          "購読は、事前のキャンセルがない限り、各請求サイクルの終了時に自動的に更新されます。",
          "購読者は、アカウント設定からいつでもキャンセルできます。サービスへのアクセスは、現在の請求サイクルの終了まで引き続きご利用いただけます。",
        ],
      },
    ],
  },
};

export default function CommercialDisclosurePage() {
  const { t, locale } = useLocale();
  const c = locale === "ja" ? CONTENT.ja : CONTENT.en;

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-center mb-10">{c.title}</h1>

        <div className="card divide-y divide-line dark:divide-dark-line overflow-hidden">
          {c.rows.map((row) => (
            <div key={row.label} className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-5 py-4">
              <div className="font-semibold text-[14px]">{row.label}</div>
              <div className="sm:col-span-2 text-[14px] text-inkmut dark:text-dark-inkmut leading-relaxed">
                {row.value}
                {row.points && (
                  <ol className="list-decimal pl-5 space-y-1">
                    {row.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line dark:border-dark-line pt-6">
          <Link href="/" className="text-[13px] text-brand-deep hover:underline">
            ← {t("legal_back_home")}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
