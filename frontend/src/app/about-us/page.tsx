"use client";
/* Public About page. Faithful recreation of the original about-us page (hero +
   mission + core vision pillars + CTA), rebuilt in the redesign design system.
   Bilingual by locale (no dict bloat), matching the existing legal pages. */
import Link from "next/link";
import { ArrowRight, Award, Check, Sparkles, Target, Users, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

const CONTENT = {
  en: {
    heroTitle: "We bring efficiency and precision to the review process in Japanese Academia",
    heroSubtitle: "日本の学術レビューを効率よく、正確にサポートします。",
    missionTitle: "An innovation from Hiroshima University",
    missionDesc:
      "A team of talented students and alumni from Hiroshima University developed PaperClue, an innovative platform designed to enhance student engagement and productivity in academic research while reducing dependency on ChatGPT and other AI tools in academic writing.",
    approachTitle: "PaperClue's Transformative Approach to Academic Writing:",
    features: [
      "Transforms mistakes into learning opportunities",
      "Helps professors get submission ready research work from their students",
      "Fixes errors and educates simultaneously",
      "Cost-effective – Saves up to 10 times cost",
      "Student-oriented and promotes active engagement",
      "Facilitates clarity in complex academic literatures",
    ],
    conclusion:
      'PaperClue transforms the traditionally slow, costly, and stressful review of research papers and theses into an accessible, educational experience through a unique "Fixes and Educates" approach.',
    joinTeam: "Join Our Team",
    visionTitle: "Core Vision Pillars",
    pillars: [
      { title: "Academic Excellence", desc: "Precision, credibility, and high scholarly standards." },
      { title: "Efficiency & Clarity", desc: "Saving time without sacrificing quality." },
      { title: "Empowerment through AI", desc: "AI as a partner, not a replacement, guiding users to improve and learn." },
    ],
    ctaTitle: "Join Our Team",
    ctaDesc:
      "We are always looking for passionate individuals who share our vision of transforming academic research and writing through AI innovation. Explore our current opportunities and become part of our journey.",
    getStarted: "Get Started",
    contact: "Contact Us",
  },
  ja: {
    heroTitle: "日本の学術レビューを効率よく、正確にサポートします",
    heroSubtitle: "日本の学術レビューを効率よく、正確にサポートします。",
    missionTitle: "広島大学発のイノベーション",
    missionDesc:
      "広島大学の優秀な学生や卒業生のチームが開発した「PaperClue（ペーパークルー）」は、学術研究における学生の自主的な取り組みを支援し、生産性を向上させることを目的とした革新的なプラットフォームです。また、ChatGPTなどのAIツールへの過度な依存を減らすことにも力を入れています。",
    approachTitle: "PaperClueによる学術ライティングの新しいアプローチ：",
    features: [
      "誤りを学びのチャンスとして活かす",
      "教員が学生に、投稿できるレベルの研究成果を提供できるようサポート",
      "エラー修正と共に、教育的なフィードバックを提供",
      "コストパフォーマンスに優れ、従来の10分の1の費用で利用可能",
      "学生主体で設計され、積極的な学びを促進",
      "複雑な学術文献の理解を助け、分かりやすい表現を実現",
    ],
    conclusion:
      "PaperClueは、従来の時間とコストがかかり、ストレスを伴った論文や修士論文のレビュー工程を、「修正」と「教育」を融合させた独自のアプローチで改善し、誰でもアクセスできる有益な学びのプロセスへと変革します。",
    joinTeam: "私たちのチームに参加しませんか",
    visionTitle: "基本理念",
    pillars: [
      { title: "学術的卓越性", desc: "正確性と信頼性を基盤とし、最高水準の学術基準を追求する。" },
      { title: "効率性と明確性", desc: "品質を損なうことなく効率を高め、明快で価値ある成果を実現する。" },
      { title: "AIによる価値創造", desc: "AIを代替ではなくパートナーとして位置づけ、利用者の成長と学習を支援する。" },
    ],
    ctaTitle: "私たちのチームに参加しませんか",
    ctaDesc:
      "私たちは、AI技術を活用して学術研究と執筆の未来を変えたいという情熱を持った方を求めています。現在募集中の職種をご確認の上、ぜひ私たちの挑戦に参加してください。",
    getStarted: "無料で始める",
    contact: "お問い合わせ",
  },
} as const;

const PILLAR_ICONS = [Target, Zap, Users];

export default function AboutPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? CONTENT.ja : CONTENT.en;

  return (
    <div className="min-h-screen font-inter bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-[#eaf1ff] to-slate-50 dark:from-[#1b2865]/40 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-pcblue bg-pcblue-light border border-pcblue/40 dark:bg-pcblue/15 rounded-full px-3 py-1 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            PaperClue
          </span>
          <h1 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
            {c.heroTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-5 text-[16px]">{c.heroSubtitle}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-inter text-2xl sm:text-3xl font-semibold">{c.missionTitle}</h2>
        <p className="text-[15px] leading-relaxed mt-5 text-slate-600 dark:text-slate-300">
          {c.missionDesc}
        </p>
        <p className="text-[15px] font-semibold mt-6">{c.approachTitle}</p>
        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          {c.features.map((f) => (
            <div key={f} className="card p-4 flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-pcblue-light text-pcblue dark:bg-pcblue/15">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-[14px] leading-snug">{f}</span>
            </div>
          ))}
        </div>
        <p className="text-[15px] leading-relaxed mt-6 text-slate-600 dark:text-slate-300">
          {c.conclusion}
        </p>
        <div className="mt-8">
          <Link href="/login" className="btn btn-outline inline-flex px-5 py-2.5 text-[15px]">
            {c.joinTeam}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Core Vision Pillars */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="font-inter text-2xl sm:text-3xl font-semibold text-center mb-12">
            {c.visionTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {c.pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[i] ?? Award;
              return (
                <div key={p.title} className="card card-hover p-8">
                  <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pcblue-light text-pcblue dark:bg-pcblue/15">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-inter text-xl font-semibold">{p.title}</h3>
                  <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 mt-3">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <h2 className="font-inter text-2xl sm:text-3xl font-semibold">{c.ctaTitle}</h2>
        <p className="text-[15px] leading-relaxed mt-4 text-slate-600 dark:text-slate-300">
          {c.ctaDesc}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Link href="/login" className="btn inline-flex px-6 py-2.5 text-[15px] bg-gradient-to-r from-[#4361ee] to-[#3953af] text-white shadow-sm hover:brightness-110">
            {c.getStarted}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="/#lp-contact" className="btn btn-outline inline-flex px-6 py-2.5 text-[15px]">
            {c.contact}
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
