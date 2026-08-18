"use client";
/* Public Pricing page. Faithful recreation of the original pricing page (plans,
   payment methods, refund link, FAQ, enterprise CTA), rebuilt in the redesign
   design system. Login-only app: all plan CTAs route to /login. Bilingual by
   locale (no dict bloat), matching the existing legal pages. */
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";
import PaymentMethods from "@/components/landing/PaymentMethods";

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  introOffer?: string;
  regularPrice?: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const CONTENT_EN = {
  title: "Simple, Transparent Pricing",
  subtitle: "Choose the plan that's right for your research needs",
  taxInfo: "All prices include sales tax.",
  popular: "Most Popular",
  plans: [
    {
      name: "Free",
      price: "¥0",
      description: "Basic features for academic research",
      features: [
        "Limited AI risk assessments",
        "Limited citation accuracy check",
        "Basic formatting options",
        "Basic Mind Map features",
        "Only ten credits available",
      ],
      cta: "Get Started",
    },
    {
      name: "Prime",
      price: "¥1,550",
      description: "Get academic reviews with one-time access",
      features: [
        "Up to 3 document reviews",
        "Up to 3 journal-specific formatting checks",
        "Up to 3 citation accuracy checks",
        "Limited AI risk assessment",
        "Basic Mind Map features",
        "Priority support",
      ],
      cta: "Get Prime",
    },
    {
      name: "Premium",
      price: "¥2,200",
      period: "month",
      description: "Enjoy more features and flexibility with Premium Plan",
      introOffer: "First month only ¥1,100",
      regularPrice: "¥2,200/month thereafter",
      features: [
        "AI humanizer",
        "Advanced grammar checks",
        "AI risk assessment",
        "Citation accuracy checks",
        "Unlimited research papers summaries",
        "Full Mind Map capabilities",
        "Priority support",
      ],
      cta: "Upgrade to Premium",
    },
    {
      name: "Pro",
      price: "¥5,500",
      period: "month",
      description: "Comprehensive tools built for dedicated researchers",
      introOffer: "First month only ¥3,300",
      regularPrice: "¥5,500/month thereafter",
      features: [
        "Unlimited research papers reviews",
        "Unlimited thesis reviews",
        "Unlimited presentation reviews",
        "Journal-specific formatting",
        "AI humanizer",
        "Advanced grammar checks",
        "AI risk assessment",
        "Citation accuracy checks",
        "Unlimited research papers summaries",
        "Full Mind Map capabilities",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
    },
    {
      name: "Team",
      price: "¥22,000",
      period: "month",
      description: "Powerful tools for research teams",
      popular: true,
      features: [
        "Up to 7 team members",
        "Unlimited research papers reviews",
        "Unlimited research proposals reviews",
        "Unlimited thesis reviews",
        "Unlimited presentation reviews",
        "Journal-specific formatting",
        "Advanced grammar checks",
        "AI humanizer",
        "AI risk assessment",
        "Citation accuracy checks",
        "Unlimited research papers summaries",
        "Full Mind Map capabilities",
        "Priority support",
      ],
      cta: "Upgrade to Team",
    },
  ] as Plan[],
  faqTitle: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is the Premium Team Plan, and how does it benefit research groups?",
      a: "The Premium Team Plan on PaperClue is a subscription option designed specifically for professors, students, and research groups. It allows one central account holder (typically a professor) to add and manage student or lab member accounts under a single, cost-effective premium subscription. This makes it easy to provide all team members with access to premium features—like the Mind Map tool, Research Refiner, and more—at a discounted per-user rate, ideal for enhancing productivity and collaboration across research teams.",
    },
    {
      q: "Can I switch plans later?",
      a: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, you'll receive a prorated credit to your account.",
    },
    {
      q: "Do you offer academic discounts?",
      a: "Yes, we offer special pricing for students, educators, and academic institutions. Contact our support team with proof of academic status to receive your discount code.",
    },
  ],
  refundLink: "Refund Policy",
  customDesc: "Need a custom solution for your institution?",
  customCta: "Contact Our Enterprise Team",
};

const CONTENT_JA = {
  title: "シンプルな料金体系",
  subtitle: "ニーズに合ったプランを選択",
  taxInfo: "すべての料金には消費税が含まれています。",
  popular: "人気",
  plans: [
    {
      name: "無料",
      price: "¥0",
      description: "学術研究のための基本機能",
      features: [
        "AIリスク評価（制限あり）",
        "引用精度チェック（制限あり）",
        "基本的なフォーマット機能",
        "基本的なマインドマップ機能",
        "利用可能クレジットは10件まで",
      ],
      cta: "無料で始める",
    },
    {
      name: "プライム",
      price: "¥1,550",
      description: "ワンタイムアクセスで学術レビューを受けられます",
      features: [
        "最大3件の文書レビュー",
        "最大3件のジャーナル別フォーマットチェック",
        "最大3件の引用精度チェック",
        "限定的なAIリスク評価",
        "基本的なマインドマップ機能",
        "優先サポート",
      ],
      cta: "プライムを取得",
    },
    {
      name: "プレミアム",
      price: "¥2,200",
      period: "月",
      description: "プレミアムプランで、より多くの機能と柔軟性を",
      introOffer: "初月のみ ¥1,100",
      regularPrice: "2か月目以降 ¥2,200／月",
      features: [
        "AIヒューマナイザー",
        "高度な文法チェック",
        "AIリスク評価",
        "引用精度チェック",
        "無制限の研究論文要約",
        "マインドマップの全機能",
        "優先サポート",
      ],
      cta: "プレミアムにアップグレード",
    },
    {
      name: "プロ",
      price: "¥5,500",
      period: "月",
      description: "熱心な研究者のための総合ツール",
      introOffer: "初月のみ ¥3,300",
      regularPrice: "2か月目以降 ¥5,500／月",
      features: [
        "研究論文レビュー 無制限",
        "論文レビュー 無制限",
        "プレゼンテーションレビュー 無制限",
        "ジャーナル別フォーマット",
        "AIヒューマナイザー",
        "高度な文法チェック",
        "AIリスク評価",
        "引用精度チェック",
        "研究論文要約 無制限",
        "マインドマップの全機能",
        "優先サポート",
      ],
      cta: "プロにアップグレード",
    },
    {
      name: "チーム",
      price: "¥22,000",
      period: "月",
      description: "研究チーム向けのコラボレーションツール",
      popular: true,
      features: [
        "最大7名のチームメンバー",
        "研究論文の無制限レビュー",
        "研究提案書の無制限レビュー",
        "論文・卒業論文の無制限レビュー",
        "プレゼンテーションの無制限レビュー",
        "ジャーナル別フォーマット対応",
        "高度な文法チェック",
        "AIヒューマナイザー",
        "AIリスク評価",
        "引用精度チェック",
        "研究論文の無制限サマリー作成",
        "マインドマップの全機能",
        "優先サポート",
      ],
      cta: "問い合わせる",
    },
  ] as Plan[],
  faqTitle: "よくある質問",
  faqs: [
    {
      q: "プレミアムチームプランとは何ですか？研究グループにどのようなメリットがありますか？",
      a: "PaperClueのプレミアムチームプランは、教授、学生、研究グループ向けに特別に設計されたサブスクリプションオプションです。メインアカウント所有者（通常は教授）が、コスト効率の良いプレミアムサブスクリプションの下で学生や研究室メンバーのアカウントを追加・管理できます。これにより、マインドマップツールや研究精査ツールなどのプレミアム機能へのアクセスを、割引されたユーザー単価で全チームメンバーに提供でき、研究チーム全体の生産性とコラボレーションを向上させるのに理想的です。",
    },
    {
      q: "後でプランを変更できますか？",
      a: "はい、いつでもプランのアップグレード/ダウングレードが可能です。 ・アップグレード時：日割りで差額を請求 ・ダウングレード時：日割りでクレジットをアカウントに付与",
    },
    {
      q: "学術割引はありますか？",
      a: "はい、学生・教育者・学術機関向けの割引をご用意しています。学生証や在籍証明をサポートチームまでご提出いただくと、割引コードを発行します。",
    },
  ],
  refundLink: "返金ポリシー",
  customDesc: "組織向けのカスタムソリューションが必要ですか？",
  customCta: "問い合わせる",
};

function PlanCard({ plan, popularLabel }: { plan: Plan; popularLabel: string }) {
  return (
    <div
      className={`card p-6 flex flex-col relative ${
        plan.popular ? "ring-2 ring-brand shadow-lift" : ""
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-ink">
          {popularLabel}
        </span>
      )}
      <h3 className="font-serif text-xl font-semibold">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mt-3">
        <span className="text-3xl font-bold">{plan.price}</span>
        {plan.period && <span className="text-[14px] text-inkmut dark:text-dark-inkmut">/{plan.period}</span>}
      </div>
      {plan.introOffer && (
        <p className="text-[14px] font-semibold text-manuscript mt-2">{plan.introOffer}</p>
      )}
      {plan.regularPrice && (
        <p className="text-[12.5px] text-inkmut dark:text-dark-inkmut">{plan.regularPrice}</p>
      )}
      <p className="text-[13.5px] text-inkmut dark:text-dark-inkmut mt-3">{plan.description}</p>

      <ul className="space-y-2.5 mt-5 mb-6 flex-grow">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-[13.5px] leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      <Link href="/login" className="btn btn-primary w-full justify-center mt-auto">
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function PricingPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? CONTENT_JA : CONTENT_EN;

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{c.title}</h1>
          <p className="text-inkmut dark:text-dark-inkmut mt-3 text-[15px]">{c.subtitle}</p>
          <p className="text-[14px] font-semibold mt-2">{c.taxInfo}</p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-14">
          {c.plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} popularLabel={c.popular} />
          ))}
        </div>

        {/* Payment methods */}
        <div className="mt-12">
          <PaymentMethods />
        </div>

        {/* Refund policy link */}
        <div className="text-center mt-2">
          <Link href="/refund-policy" className="text-[14px] text-brand-deep hover:underline">
            {c.refundLink}
          </Link>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16 card p-8">
          <h2 className="font-serif text-2xl font-semibold mb-6">{c.faqTitle}</h2>
          <div className="space-y-6">
            {c.faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-[15px] mb-1.5">{faq.q}</h3>
                <p className="text-[14px] leading-relaxed text-inkmut dark:text-dark-inkmut">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16">
          <p className="text-inkmut dark:text-dark-inkmut mb-4 text-[15px]">{c.customDesc}</p>
          <a
            href="mailto:contact@paperclue.ai"
            className="btn btn-outline inline-flex px-6 py-2.5 text-[15px]"
          >
            {c.customCta}
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
