"use client";
/* Public Refund Policy page. Faithful recreation of the original, rebuilt in the
   redesign design system. Bilingual by locale. */
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

type Section = { title: string; before?: string[]; listIntro?: string; list?: string[]; after?: string[] };

const CONTENT: { en: { title: string; intro: string; sections: Section[] }; ja: { title: string; intro: string; sections: Section[] } } = {
  en: {
    title: "Refund Policy – Paper Clue AI",
    intro:
      'PaperClue.ai ("the Company") is an AI assistant designed to support research and academic writing. Our company, Paper Clue Inc., is a software service provider headquartered in Hiroshima Prefecture, Japan.',
    sections: [
      {
        title: "1. Secure Payments",
        before: [
          "All payments made on www.paperclue.ai are securely processed via Stripe, a globally trusted payment processor.",
          "Stripe encrypts and safeguards your payment information to ensure that your personal and financial data remain protected at every stage of the transaction.",
          "We never store your credit card details on our servers.",
        ],
        listIntro: "Accepted payment methods include:",
        list: [
          "Major credit and debit cards (Visa, MasterCard, American Express, JCB, Discover, and Diners Club)",
          "Digital wallets supported by Stripe (e.g., Apple Pay, Google Pay)",
          "Bank transfer (wire transfer)",
        ],
      },
      {
        title: "2. Eligibility for Refund",
        listIntro: "You may be eligible for a refund if:",
        list: [
          "You were charged multiple times for the same transaction due to a technical or billing error.",
          "The purchased service (based on Prime, Premium, Pro or Team Plan) was not delivered or inaccessible due to a verified system issue on our end.",
          "You canceled a subscription renewal within the grace period but were still charged.",
          "Our support team fails to resolve a verified technical issue within 14 business days after your report.",
        ],
      },
      {
        title: "3. Non-Refundable Situations",
        listIntro: "Refunds will not be granted in the following cases:",
        list: [
          "Dissatisfaction with subjective outcomes (e.g., tone, ranking, or quality of AI feedback).",
          "The purchased service has been accessed, downloaded, or used successfully.",
          "Incorrect or incomplete information was provided by the user.",
          "The refund request is submitted more than 7 days after purchase.",
          "Subscription periods that have already started and been used (partially or fully) are not eligible for prorated refunds.",
        ],
      },
      {
        title: "4. Subscriptions and Renewals",
        list: [
          "Subscriptions renew automatically unless canceled before the next billing date.",
          "You can cancel anytime via your account settings or by contacting contact@paperclue.ai.",
          "Once canceled, your access will remain active until the end of the paid billing cycle.",
          "Refunds for renewals will only be issued if the cancellation request is made within 3 days of renewal and you have not used the service during that period.",
        ],
      },
      {
        title: "5. How to Request a Refund",
        listIntro: "To request a refund, please contact contact@paperclue.ai and include:",
        list: [
          "Your order ID or transaction reference",
          "The email address used for the purchase",
          "A brief description of the issue",
        ],
        after: ["Our support team will review your request and respond within 5–7 business days."],
      },
      {
        title: "6. Refund Method and Processing Time",
        list: [
          "Approved refunds will be issued to your original payment method via Stripe.",
          "Processing typically takes 5–10 business days, depending on Stripe policy and your bank or card provider.",
          "Bank transfer (wire transfer) - bank transfer refunds will be processed back to the original bank account after verification",
        ],
      },
      {
        title: "7. Policy Updates",
        before: [
          "Paper Clue AI reserves the right to modify this Refund Policy at any time. Updates will be posted on this page, and the effective date will be revised accordingly.",
        ],
      },
      {
        title: "8. Governing Law",
        before: [
          "This Refund Policy is governed by the laws of Japan. Any disputes will be subject to the jurisdiction of the courts in Hiroshima Prefecture.",
        ],
      },
    ],
  },
  ja: {
    title: "返金ポリシー – Paper Clue AI",
    intro:
      "PaperClue.ai（以下「当社」）は、研究および学術執筆を支援するAIアシスタントです。当社、Paper Clue Inc. は、日本の広島県に本社を置くソフトウェアサービス提供会社です。",
    sections: [
      {
        title: "1. 安全な決済",
        before: [
          "www.paperclue.aiでのすべての支払いは、Stripeを通じて安全に処理されます。Stripeは、世界的に信頼されているPCI-DSS準拠の決済プロセッサです。",
          "Stripeは、決済情報を暗号化し、個人情報や金融情報が常に保護されるよう管理します。",
          "当社は、クレジットカード情報をサーバーに保存することはありません。",
        ],
        listIntro: "ご利用可能な支払い方法:",
        list: [
          "主要なクレジット・デビットカード（Visa、MasterCard、American Express、JCB、Discover、Diners Club）",
          "Stripe対応のデジタルウォレット（Apple Pay、Google Payなど）",
          "銀行振込（ワイヤートランスファー）",
        ],
      },
      {
        title: "2. 返金の対象",
        listIntro: "以下の場合、返金の対象となる可能性があります：",
        list: [
          "技術的または請求上のエラーにより、同一取引で二重請求が発生した場合",
          "購入したサービス（Prime、Premium、Pro、Teamプランなど）が提供されなかった、またはアクセスできなかった場合",
          "サブスクリプションの自動更新をキャンセルしたにもかかわらず課金された場合",
          "当社サポートチームが、確認済みの技術的問題を7営業日以内に解決できなかった場合",
        ],
      },
      {
        title: "3. 返金対象外の場合",
        listIntro: "以下の場合、返金は対象外です：",
        list: [
          "AIのフィードバックや評価結果など、主観的な内容への不満",
          "購入したサービスが既に利用、ダウンロード、またはアクセスされている場合",
          "ユーザーが不正確または不完全な情報を提供した場合",
          "サブスクリプション期間が開始され、部分的または全て利用済みの場合は、按分返金の対象外",
        ],
      },
      {
        title: "4. サブスクリプションおよび自動更新",
        list: [
          "サブスクリプションは、次回請求日までにキャンセルされない限り自動更新されます。",
          "アカウント設定から、または contact@paperclue.ai までご連絡いただくことで、いつでもキャンセル可能です。",
          "キャンセル後も、支払い済み期間の終了まではサービスを利用可能です。",
          "更新後の返金は、更新日から3日以内にキャンセルし、かつサービスを利用していない場合に限り適用されます。",
        ],
      },
      {
        title: "5. 返金の申請方法",
        listIntro: "返金を希望される場合は、contact@paperclue.ai までご連絡ください。",
        list: ["注文IDまたは取引番号", "ご購入時のメールアドレス", "問題の簡単な説明"],
        after: ["サポートチームが内容を確認し、5～7営業日以内にご返信いたします。"],
      },
      {
        title: "6. 返金方法と処理期間",
        list: [
          "クレジットカード・デジタルウォレットでのお支払いは、Stripeを通じて元の支払い方法に返金されます。",
          "銀行振込でのお支払いは、お支払いに使用した銀行口座に返金されます（確認後）。",
          "処理期間は通常5～10営業日で、金融機関によって変動する場合があります。",
        ],
      },
      {
        title: "7. ポリシーの更新",
        before: [
          "Paper Clue AIは、本返金ポリシーを随時変更する権利を有します。変更があった場合、本ページにて更新内容と施行日を明示します。",
        ],
      },
      {
        title: "8. 準拠法",
        before: [
          "本返金ポリシーは日本の法律に準拠し、紛争が生じた場合は広島県の裁判所を専属的合意管轄とします。",
        ],
      },
    ],
  },
};

export default function RefundPolicyPage() {
  const { t, locale } = useLocale();
  const c = locale === "ja" ? CONTENT.ja : CONTENT.en;

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{c.title}</h1>
        <p className="text-[15px] leading-relaxed mt-6 text-ink/90 dark:text-dark-ink">{c.intro}</p>

        <div className="mt-8 space-y-8">
          {c.sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-serif text-xl font-semibold">{s.title}</h2>
              {s.before?.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-relaxed mt-3 text-inkmut dark:text-dark-inkmut">
                  {p}
                </p>
              ))}
              {s.listIntro && (
                <p className="text-[14.5px] leading-relaxed mt-3 text-inkmut dark:text-dark-inkmut">
                  {s.listIntro}
                </p>
              )}
              {s.list && (
                <ul className="list-disc pl-6 mt-2 space-y-1.5 text-[14.5px] leading-relaxed text-inkmut dark:text-dark-inkmut">
                  {s.list.map((li, i) => (
                    <li key={i}>{li}</li>
                  ))}
                </ul>
              )}
              {s.after?.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-relaxed mt-3 text-inkmut dark:text-dark-inkmut">
                  {p}
                </p>
              ))}
            </section>
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
