"use client";
/* Shared create/edit form for superadmin blog posts — identical fields
   either way, just a different initial value and submit handler. */
import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/ui";
import { CATEGORIES } from "@/lib/blog-categories";

export interface BlogPostFormValues {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  read_time: string;
  image: string;
  tags: string;
  featured: boolean;
  published: boolean;
}

const EMPTY: BlogPostFormValues = {
  title: "",
  excerpt: "",
  content: "",
  author: "",
  category: "",
  read_time: "",
  image: "",
  tags: "",
  featured: false,
  published: false,
};

export function BlogPostForm({
  initial,
  onSubmit,
  submitLabel,
  extraActions,
}: {
  initial?: Partial<BlogPostFormValues>;
  onSubmit: (values: BlogPostFormValues) => Promise<void>;
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  const { t } = useLocale();
  const [values, setValues] = useState<BlogPostFormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BlogPostFormValues>(key: K, value: BlogPostFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-3">
      {error && <div className="text-xs text-danger">{error}</div>}

      <label className="text-xs font-medium text-inkmut">
        {t("superadmin_blog_form_title")}
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          required
        />
      </label>

      <label className="text-xs font-medium text-inkmut">
        {t("superadmin_blog_form_excerpt")}
        <textarea
          value={values.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
        />
      </label>

      <label className="text-xs font-medium text-inkmut">
        {t("superadmin_blog_form_content")}
        <textarea
          value={values.content}
          onChange={(e) => set("content", e.target.value)}
          rows={10}
          className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm font-mono"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-inkmut">
          {t("superadmin_blog_form_author")}
          <input
            value={values.author}
            onChange={(e) => set("author", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-inkmut">
          {t("superadmin_blog_form_category")}
          <select
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          >
            <option value=""></option>
            {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-inkmut">
          {t("superadmin_blog_form_read_time")}
          <input
            value={values.read_time}
            onChange={(e) => set("read_time", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-inkmut">
          {t("superadmin_blog_form_image")}
          <input
            value={values.image}
            onChange={(e) => set("image", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="text-xs font-medium text-inkmut">
        {t("superadmin_blog_form_tags")}
        <input
          value={values.tags}
          onChange={(e) => set("tags", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
        />
      </label>

      <div className="flex items-center gap-4 mt-1">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          {t("superadmin_blog_form_featured")}
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={values.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          {t("superadmin_blog_form_published")}
        </label>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button type="submit" disabled={saving} className="btn btn-primary px-4 py-1.5">
          {saving ? <Spinner className="h-4 w-4" /> : submitLabel}
        </button>
        {extraActions}
      </div>
    </form>
  );
}
