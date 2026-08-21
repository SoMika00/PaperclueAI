"use client";
/* Public Blog page. Faithful recreation of the original blog layout (header,
   search + category filters, article list, newsletter signup), rebuilt in the
   redesign design system. Posts come from the platform-admin-managed
   /api/blog/posts endpoint (backend/app/routers/blog.py); the empty state
   still shows when there are genuinely zero published posts. Bilingual by
   locale. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/blog-categories";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  read_time: string;
  image: string | null;
  featured: boolean;
  tags: string[];
  created_at: string | null;
}

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
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);

  useEffect(() => {
    api<BlogPostSummary[]>("/blog/posts?limit=100")
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const reset = () => {
    setQuery("");
    setCategory("All Categories");
  };

  const filtered = (posts || []).filter((p) => {
    const matchesCategory = category === "All Categories" || p.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen font-inter bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-inter text-3xl sm:text-4xl font-semibold">{c.title}</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 text-[15px]">{c.subtitle}</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-12">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pcblue"
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
                      ? "bg-gradient-to-r from-[#4361ee] to-[#3953af] text-white border-transparent"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat === "All Categories" ? c.all : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article list */}
        <div className="mt-12">
          <h2 className="font-inter text-2xl font-semibold mb-6">{c.latestArticles}</h2>
          {posts !== null && filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {filtered.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="card p-5 flex flex-col hover:shadow-lift transition-shadow"
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {p.category && <span>{p.category}</span>}
                    {p.read_time && (
                      <>
                        <span>·</span>
                        <span>{p.read_time}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-inter text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 flex-grow">
                    {p.excerpt}
                  </p>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-4">
                    {p.author}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <p className="text-slate-600 dark:text-slate-300">{c.noArticlesFound}</p>
              <button onClick={reset} className="btn btn-outline mt-4 inline-flex px-5 py-2">
                {c.resetFilters}
              </button>
            </div>
          )}
        </div>

        {/* Newsletter */}
        <div className="mt-16 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-8 text-center">
          <h3 className="font-inter text-2xl font-semibold">{c.subscribeNewsletter}</h3>
          <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-2xl mx-auto text-[15px]">
            {c.newsletterDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              className="flex-grow rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pcblue"
            />
            <a
              href={`mailto:contact@paperclue.ai?subject=${encodeURIComponent("Newsletter subscription")}&body=${encodeURIComponent(email)}`}
              className="btn justify-center bg-gradient-to-r from-[#4361ee] to-[#3953af] text-white shadow-sm hover:brightness-110"
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
