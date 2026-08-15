"use client";
/* Public Terms of Service. Content is a standard template — have it reviewed by
   counsel before relying on it. Bilingual by locale (no dict bloat). */
import LegalLayout, { type LegalSection } from "@/components/landing/LegalLayout";
import { useLocale } from "@/lib/i18n";

const EN: { title: string; updated: string; intro: string; sections: LegalSection[] } = {
  title: "Terms & Conditions",
  updated: "Last updated: August 2026",
  intro:
    "These Terms govern your use of PaperClue. By creating an account or using the service, you agree to these Terms. Please read them carefully.",
  sections: [
    {
      heading: "Accounts",
      body: [
        "You need an account to use PaperClue. You are responsible for keeping your credentials secure and for activity under your account. Provide accurate information and keep it up to date.",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "Use PaperClue for legitimate academic and research purposes. Do not upload content you have no right to use, attempt to disrupt the service, or use it to violate any law or third-party rights.",
        "PaperClue assists your work; you remain responsible for the accuracy, integrity and originality of anything you submit or publish.",
      ],
    },
    {
      heading: "Your content",
      body: [
        "You retain ownership of the manuscripts and content you upload. You grant us a limited licence to process that content solely to provide the features you request. See our Privacy Policy for details.",
      ],
    },
    {
      heading: "Subscriptions and billing",
      body: [
        "Paid plans are billed in advance on a recurring basis (monthly or annual) through our payment processor, Stripe. Prices are shown at checkout. Promotional codes apply as described at checkout.",
        "You can cancel at any time from the billing portal; access continues until the end of the current billing period. Except where required by law, payments are non-refundable.",
      ],
    },
    {
      heading: "Service availability",
      body: [
        "We work to keep PaperClue available and reliable, but the service is provided “as is” without warranties. Features may change or be discontinued.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the extent permitted by law, PaperClue is not liable for indirect or consequential damages arising from your use of the service. Nothing in these Terms excludes liability that cannot be excluded by law.",
      ],
    },
    {
      heading: "Changes and contact",
      body: [
        "We may update these Terms; material changes will be notified in the app. Questions? Email support@paperclue.ai.",
      ],
    },
  ],
};

const JA: { title: string; updated: string; intro: string; sections: LegalSection[] } = {
  title: "利用規約",
  updated: "最終更新日：2026年8月",
  intro:
    "本規約は、PaperClueの利用に適用されます。アカウントを作成またはサービスを利用することで、本規約に同意したものとみなされます。よくお読みください。",
  sections: [
    {
      heading: "アカウント",
      body: [
        "PaperClueの利用にはアカウントが必要です。認証情報の安全な管理およびアカウント上の活動について、利用者が責任を負います。正確な情報を提供し、最新の状態に保ってください。",
      ],
    },
    {
      heading: "許容される利用",
      body: [
        "PaperClueは、正当な学術・研究目的で利用してください。利用権のないコンテンツのアップロード、サービスの妨害、法令や第三者の権利を侵害する利用は禁止します。",
        "PaperClueは作業を支援するものであり、提出・公開する内容の正確性・誠実性・独自性については利用者が責任を負います。",
      ],
    },
    {
      heading: "利用者のコンテンツ",
      body: [
        "アップロードした原稿やコンテンツの所有権は利用者に帰属します。利用者は、要求された機能を提供する目的に限り、当社が当該コンテンツを処理するための限定的なライセンスを当社に付与します。詳細はプライバシーポリシーをご覧ください。",
      ],
    },
    {
      heading: "サブスクリプションと請求",
      body: [
        "有料プランは、決済事業者Stripeを通じて、定期的（月額または年額）に前払いで請求されます。価格は決済時に表示されます。プロモーションコードは決済時の記載に従って適用されます。",
        "請求ポータルからいつでも解約でき、現在の請求期間の終了までアクセスが継続します。法令で求められる場合を除き、支払いは返金されません。",
      ],
    },
    {
      heading: "サービスの提供",
      body: [
        "当社はPaperClueを安定的に提供するよう努めますが、サービスは「現状有姿」で提供され、いかなる保証も行いません。機能は変更または終了する場合があります。",
      ],
    },
    {
      heading: "責任の制限",
      body: [
        "法令で認められる範囲において、当社はサービスの利用に起因する間接的・結果的損害について責任を負いません。本規約は、法令上除外できない責任を除外するものではありません。",
      ],
    },
    {
      heading: "変更とお問い合わせ",
      body: [
        "当社は本規約を更新することがあります。重要な変更はアプリ内で通知します。ご質問は support@paperclue.ai までご連絡ください。",
      ],
    },
  ],
};

export default function TermsPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? JA : EN;
  return <LegalLayout {...c} />;
}
