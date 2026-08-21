"use client";
/* Public blog post detail page. Fetches the published post by slug from
   /api/blog/posts/{slug} (backend/app/routers/blog.py) and renders its
   Markdown body. Same marketing look as the blog list page. */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { api } from "@/lib/api";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  read_time: string;
  image: string | null;
  tags: string[];
  created_at: string | null;
}

const CONTENT = {
  en: { back: "Back to Blog", notFound: "This article couldn't be found." },
  ja: { back: "ブログに戻る", notFound: "この記事は見つかりませんでした。" },
} as const;

export default function BlogPostPage() {
  const { locale } = useLocale();
  const c = locale === "ja" ? CONTENT.ja : CONTENT.en;
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<BlogPost>(`/blog/posts/${params.slug}`)
      .then(setPost)
      .catch(() => setError(true));
  }, [params.slug]);

  return (
    <div className="min-h-screen font-inter bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-pcblue"
        >
          <ArrowLeft className="h-4 w-4" />
          {c.back}
        </Link>

        {error ? (
          <div className="card text-center py-16 mt-8">
            <p className="text-slate-600 dark:text-slate-300">{c.notFound}</p>
          </div>
        ) : post ? (
          <article className="mt-6">
            <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
              {post.category && <span>{post.category}</span>}
              {post.read_time && (
                <>
                  <span>·</span>
                  <span>{post.read_time}</span>
                </>
              )}
            </div>
            <h1 className="font-inter text-3xl sm:text-4xl font-semibold mt-3">{post.title}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-3">{post.author}</div>
            {post.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image}
                alt={post.title}
                className="w-full rounded-lg mt-8 object-cover"
              />
            )}
            <div className="blog-md mt-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          </article>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
