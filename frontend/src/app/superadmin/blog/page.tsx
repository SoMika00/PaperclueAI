"use client";
/* All blog posts (draft + published) — the CMS behind the public /blog page. */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  featured: boolean;
  published: boolean;
  created_at: string | null;
}

export default function SuperadminBlogPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<BlogPost[]>("/superadmin/blog/posts").then(setPosts).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (p: BlogPost) => {
    if (!confirm(t("superadmin_blog_delete_confirm"))) return;
    setError(null);
    try {
      await api(`/superadmin/blog/posts/${p.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (ready && profile && profile.role !== "platform_admin") {
    return (
      <GlobalShell>
        <div className="max-w-3xl mx-auto px-8 py-16 text-center text-inkmut">
          <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-40" />
          {t("superadmin_only")}
        </div>
      </GlobalShell>
    );
  }

  return (
    <GlobalShell>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold">{t("superadmin_blog_title")}</h1>
            <p className="text-sm text-inkmut mt-0.5">{t("superadmin_blog_subtitle")}</p>
          </div>
          <Link href="/superadmin/blog/new" className="btn btn-primary px-3 py-1.5">
            <Plus className="h-4 w-4" />
            {t("superadmin_blog_new")}
          </Link>
        </div>

        {error && <div className="card p-3 text-xs text-danger mt-4">{error}</div>}
        {posts === null && <Spinner className="h-5 w-5 text-brand mt-6" />}
        {posts !== null && posts.length === 0 && (
          <div className="text-center py-16 text-inkmut text-sm">{t("superadmin_blog_empty")}</div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          {(posts || []).map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <Link href={`/superadmin/blog/${p.id}/edit`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`badge ${p.published ? "" : "text-warn border-warn/40"}`}>
                    {p.published ? t("superadmin_blog_published") : t("superadmin_blog_draft")}
                  </span>
                  {p.featured && <span className="badge">{t("superadmin_blog_featured")}</span>}
                  {p.category && <span className="text-[11px] text-inkmut">{p.category}</span>}
                </div>
                <div className="font-medium text-[14px] mt-1">{p.title}</div>
                <div className="text-xs text-inkmut mt-0.5">{p.author}</div>
              </Link>
              <button
                onClick={() => remove(p)}
                className="btn btn-ghost p-1.5 hover:text-danger"
                title={t("superadmin_blog_delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlobalShell>
  );
}
