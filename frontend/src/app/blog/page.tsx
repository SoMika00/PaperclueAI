"use client";
/* Public Blog page. Faithful recreation of the original blog layout (header,
   search + category filters, article list, newsletter signup), rebuilt in the
   redesign design system. The original loads posts from a backend that is not
   part of this login-only app, so the article list shows the empty state — no
   posts are fabricated. Bilingual by locale. */
import { useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

// Categories are English-only static labels in the original source.
const CATEGORIES = [
  "All Categories",
  "Academic Writing",
  "Research Technology",
  "Research Methods",
  "Academic Standards",
  "Research Management",
  "Publishing",
];

const CONTENT = {
  en: {
    title: "Blog",
    subtitle: "Insights and tips for academic research and writing",
    searchPlaceholder: "Search articles...",
    all: "All",
    latestArticles: "Latest Articles",
    noArticlesFound: "No Articles Found",
    resetFilters: "Reset Filters",
    subscribeNewsletter: "Subscribe to Our Newsletter",
    newsletterDescription:
      "Get the latest research tips and academic writing advice delivered to your inbox.",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
  },
  ja: {
    title: "ブログ",
    subtitle: "研究と論文執筆のための洞察とヒント",
    searchPlaceholder: "記事を検索...",
    all: "全て",
    latestArticles: "最新記事",
    noArticlesFound: "条件に一致する記事が見つかりませんでした。",
    resetFilters: "フィルターをリセット",
    subscribeNewsletter: "ニュースレターに登録する",
    newsletterDescription:
      "最新の研究のヒントとアカデミックライティングのアドバイスをメールでお届けします。",
    emailPlaceholder: "メールアドレス",
    subscribe: "登録する",
  },
} as const;

export default function BlogPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? CONTENT.ja : CONTENT.en;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [email, setEmail] = useState("");

  const reset = () => {
    setQuery("");
    setCategory("All Categories");
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{c.title}</h1>
          <p className="text-inkmut dark:text-dark-inkmut mt-3 text-[15px]">{c.subtitle}</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-12">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmut dark:text-dark-inkmut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className="w-full rounded-lg border border-line dark:border-dark-line bg-paper dark:bg-dark-surface dark:text-dark-ink pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors border ${
                    active
                      ? "bg-brand text-ink border-brand"
                      : "border-line dark:border-dark-line text-inkmut dark:text-dark-inkmut hover:bg-surface2 dark:hover:bg-dark-surface2"
                  }`}
                >
                  {cat === "All Categories" ? c.all : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article list (empty state — no posts in this app) */}
        <div className="mt-12">
          <h2 className="font-serif text-2xl font-semibold mb-6">{c.latestArticles}</h2>
          <div className="card text-center py-16">
            <p className="text-inkmut dark:text-dark-inkmut">{c.noArticlesFound}</p>
            <button onClick={reset} className="btn btn-outline mt-4 inline-flex px-5 py-2">
              {c.resetFilters}
            </button>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 rounded-lg border border-line dark:border-dark-line bg-surface2/60 dark:bg-dark-surface/40 p-8 text-center">
          <h3 className="font-serif text-2xl font-semibold">{c.subscribeNewsletter}</h3>
          <p className="text-inkmut dark:text-dark-inkmut mt-2 max-w-2xl mx-auto text-[15px]">
            {c.newsletterDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              className="flex-grow rounded-lg border border-line dark:border-dark-line bg-paper dark:bg-dark-surface dark:text-dark-ink px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <a
              href={`mailto:contact@paperclue.ai?subject=${encodeURIComponent("Newsletter subscription")}&body=${encodeURIComponent(email)}`}
              className="btn btn-primary justify-center"
            >
              {c.subscribe}
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
