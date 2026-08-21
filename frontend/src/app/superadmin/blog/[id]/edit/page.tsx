"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";
import { BlogPostForm, type BlogPostFormValues } from "@/components/superadmin/BlogPostForm";

interface BlogPostDetail extends Omit<BlogPostFormValues, "tags" | "image"> {
  id: string;
  tags: string[];
  image: string | null;
}

export default function EditBlogPostPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BlogPostDetail>(`/superadmin/blog/posts/${params.id}`)
      .then(setPost)
      .catch((e) => setError(e.message));
  }, [params.id]);

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

  const handleSubmit = async (values: BlogPostFormValues) => {
    await api(`/superadmin/blog/posts/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...values,
        image: values.image || null,
        tags: values.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    router.push("/superadmin/blog");
  };

  const handleDelete = async () => {
    if (!confirm(t("superadmin_blog_delete_confirm"))) return;
    await api(`/superadmin/blog/posts/${params.id}`, { method: "DELETE" });
    router.push("/superadmin/blog");
  };

  return (
    <GlobalShell>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold mb-6">{t("superadmin_blog_form_edit_title")}</h1>
        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {!post && !error && <Spinner className="h-5 w-5 text-brand" />}
        {post && (
          <BlogPostForm
            initial={{ ...post, tags: (post.tags || []).join(", "), image: post.image || "" }}
            onSubmit={handleSubmit}
            submitLabel={t("superadmin_blog_form_save")}
            extraActions={
              <button type="button" onClick={handleDelete} className="btn btn-outline px-3 py-1.5 hover:text-danger">
                <Trash2 className="h-4 w-4" />
                {t("superadmin_blog_delete")}
              </button>
            }
          />
        )}
      </div>
    </GlobalShell>
  );
}
