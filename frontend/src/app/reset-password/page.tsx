"use client";
/* Completes the Supabase password-recovery flow: the email link lands here
   with a recovery token in the URL hash, which supabase-js turns into a
   session automatically (detectSessionInUrl, on by default). We just collect
   the new password and call updateUser. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error")) {
      setError(hash.get("error_description")?.replace(/\+/g, " ") || t("reset_password_invalid_link"));
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setValidLink(!!data.session);
      setReady(true);
    });
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("reset_password_mismatch"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.replace("/home"), 1500);
  };

  return (
    <div className="h-screen grid place-items-center bg-ivory dark:bg-dark-bg px-6 transition-colors">
      <div className="card p-8 w-full max-w-sm text-center shadow-drawer">
        <Link href="/" className="inline-block">
          <img src="/paperclue-logo.png" alt="PaperClue" className="mx-auto h-9 w-auto" />
        </Link>
        <h1 className="font-serif text-xl font-semibold mt-3">{t("reset_password_title")}</h1>
        <p className="text-sm text-inkmut dark:text-dark-inkmut mt-1 mb-5">
          {t("reset_password_subtitle")}
        </p>

        {!ready ? null : !validLink ? (
          <>
            <p className="text-xs text-red-600 mb-4">{error || t("reset_password_invalid_link")}</p>
            <Link href="/login" className="btn btn-primary w-full justify-center">
              {t("reset_password_request_new")}
            </Link>
          </>
        ) : success ? (
          <p className="text-sm text-manuscript">{t("reset_password_success")}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("reset_password_placeholder")}
              className="w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-3 py-2 text-sm mb-2"
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("reset_password_confirm_placeholder")}
              className="w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-3 py-2 text-sm mb-3"
              required
              minLength={6}
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
              {loading ? t("reset_password_loading") : t("reset_password_button")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
