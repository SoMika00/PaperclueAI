"use client";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { useLocale } from "@/lib/i18n";
import { BlogPostForm, type BlogPostFormValues } from "@/components/superadmin/BlogPostForm";

export default function NewBlogPostPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

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
    await api("/superadmin/blog/posts", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        image: values.image || null,
        tags: values.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    router.push("/superadmin/blog");
  };

  return (
    <GlobalShell>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold mb-6">{t("superadmin_blog_form_create_title")}</h1>
        <BlogPostForm onSubmit={handleSubmit} submitLabel={t("superadmin_blog_form_save")} />
      </div>
    </GlobalShell>
  );
}
