"use client";
/* Public Privacy Policy. Content is a standard template — have it reviewed by
   counsel before relying on it. Bilingual by locale (no dict bloat). */
import LegalLayout, { type LegalSection } from "@/components/landing/LegalLayout";
import { useLocale } from "@/lib/i18n";

const EN: { title: string; updated: string; intro: string; sections: LegalSection[] } = {
  title: "Privacy Policy",
  updated: "Last updated: August 2026",
  intro:
    "PaperClue (“we”, “us”) helps researchers understand, improve and prepare academic work. This policy explains what information we collect, how we use it, and the choices you have. It applies to the PaperClue web application and related services.",
  sections: [
    {
      heading: "Information we collect",
      body: [
        "Account information: your name, email address and institutional affiliation, provided when your account is created.",
        "Content you provide: manuscripts, documents and text you upload or enter to use features such as review, insight, journal formatting and mind maps.",
        "Usage data: basic technical logs (device, browser, timestamps) needed to operate and secure the service.",
      ],
    },
    {
      heading: "How we use your information",
      body: [
        "To provide the features you request — analyzing your document, generating insights, checking citations and producing outputs.",
        "To maintain, secure and improve the service, and to provide support.",
        "We do not sell your personal information, and we do not use your uploaded manuscripts to train third-party foundation models.",
      ],
    },
    {
      heading: "AI processing",
      body: [
        "Some features send the text you provide to third-party AI providers solely to generate your result. Those providers process the content to return a response and do not receive your account identity beyond what is necessary.",
      ],
    },
    {
      heading: "Data storage and security",
      body: [
        "Your data is stored on managed cloud infrastructure with access controls and encryption in transit. We retain your content only as long as needed to provide the service or as required by law.",
      ],
    },
    {
      heading: "Your choices",
      body: [
        "You can access, correct or delete your account content from within the app, or by contacting us. Deleting your account removes your associated content, subject to legal retention requirements.",
      ],
    },
    {
      heading: "Contact",
      body: ["Questions about this policy? Email us at support@paperclue.ai."],
    },
  ],
};

const JA: { title: string; updated: string; intro: string; sections: LegalSection[] } = {
  title: "プライバシーポリシー",
  updated: "最終更新日：2026年8月",
  intro:
    "PaperClue（以下「当社」）は、研究者が学術的な成果を理解し、改善し、投稿準備を行うことを支援します。本ポリシーは、当社が収集する情報、その利用方法、および利用者の選択肢について説明します。本ポリシーはPaperClueのウェブアプリケーションおよび関連サービスに適用されます。",
  sections: [
    {
      heading: "収集する情報",
      body: [
        "アカウント情報：アカウント作成時に提供される氏名、メールアドレス、所属機関。",
        "利用者が提供するコンテンツ：レビュー、インサイト、ジャーナル整形、マインドマップなどの機能を利用するためにアップロードまたは入力する原稿・文書・テキスト。",
        "利用データ：サービスの運用と安全確保に必要な基本的な技術ログ（デバイス、ブラウザ、タイムスタンプ）。",
      ],
    },
    {
      heading: "情報の利用方法",
      body: [
        "利用者が要求した機能（文書の分析、インサイトの生成、引用の確認、成果物の作成）を提供するため。",
        "サービスの維持・安全確保・改善、およびサポート提供のため。",
        "当社は個人情報を販売せず、アップロードされた原稿を第三者の基盤モデルの学習に使用しません。",
      ],
    },
    {
      heading: "AIによる処理",
      body: [
        "一部の機能では、結果を生成する目的に限り、利用者が提供したテキストを第三者のAIプロバイダーに送信します。これらのプロバイダーは応答を返すためにコンテンツを処理し、必要以上のアカウント情報を受け取ることはありません。",
      ],
    },
    {
      heading: "データの保存とセキュリティ",
      body: [
        "利用者のデータは、アクセス制御と通信の暗号化を備えたマネージドクラウド基盤に保存されます。コンテンツはサービス提供に必要な期間、または法令で求められる期間のみ保持します。",
      ],
    },
    {
      heading: "利用者の選択",
      body: [
        "アプリ内または当社への連絡により、アカウントのコンテンツにアクセス・修正・削除できます。アカウントを削除すると、法令上の保持義務に従いつつ、関連するコンテンツが削除されます。",
      ],
    },
    {
      heading: "お問い合わせ",
      body: ["本ポリシーに関するご質問は support@paperclue.ai までご連絡ください。"],
    },
  ],
};

export default function PrivacyPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? JA : EN;
  return <LegalLayout {...c} />;
}
