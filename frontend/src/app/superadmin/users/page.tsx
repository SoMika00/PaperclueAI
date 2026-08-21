"use client";
/* Platform-wide user list: every profile, every institution. Suspend/
   reactivate goes through Supabase's own Admin API (backend/superadmin.py),
   not a local status column. Password reset is sent directly from the
   browser via the same supabase.auth.resetPasswordForEmail call the
   sign-in form's own "forgot password" mode uses. */
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface PlatformUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  institution_id: string | null;
  created_at: string;
  sub_status: string | null;
  sub_plan: string | null;
  suspended: boolean;
}

const ROLES = ["individual", "teacher", "student", "institution_admin", "platform_admin"];

export default function SuperadminUsersPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [users, setUsers] = useState<PlatformUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    api<PlatformUser[]>(`/superadmin/users?${params.toString()}`)
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, [q, role]);

  useEffect(load, [load]);

  const toggleSuspend = async (u: PlatformUser) => {
    setBusyId(u.id);
    setError(null);
    try {
      await api(`/superadmin/users/${u.id}/${u.suspended ? "reactivate" : "suspend"}`, { method: "POST" });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const sendReset = async (u: PlatformUser) => {
    if (!u.email) return;
    setInfo(null);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setInfo(t("superadmin_users_reset_sent"));
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
      <div className="max-w-5xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("superadmin_users_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">{t("superadmin_users_subtitle")}</p>

        <div className="flex gap-2 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("superadmin_users_search_placeholder")}
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
          >
            <option value="">{t("superadmin_users_all_roles")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {info && <div className="card p-3 text-xs text-manuscript mb-4">{info}</div>}
        {users === null && <Spinner className="h-5 w-5 text-brand" />}
        {users !== null && users.length === 0 && (
          <div className="text-center py-16 text-inkmut text-sm">{t("superadmin_users_empty")}</div>
        )}

        <div className="flex flex-col gap-3">
          {(users || []).map((u) => (
            <div key={u.id} className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] flex items-center gap-2">
                  {u.full_name || u.email || u.id}
                  {u.suspended && <span className="badge text-danger border-danger/40">suspended</span>}
                </div>
                <div className="text-xs text-inkmut mt-0.5 flex items-center gap-2">
                  <span className="truncate">{u.email}</span>
                  <span className="badge">{u.role}</span>
                  {u.sub_status && u.sub_status !== "none" && (
                    <span className="badge">{u.sub_plan || u.sub_status}</span>
                  )}
                  {!u.institution_id && (
                    <span className="text-inkmut/70">{t("superadmin_users_no_institution")}</span>
                  )}
                </div>
              </div>
              <button onClick={() => sendReset(u)} className="btn btn-outline px-2.5 py-1.5 text-xs whitespace-nowrap">
                {t("superadmin_users_reset_password")}
              </button>
              <button
                onClick={() => toggleSuspend(u)}
                disabled={busyId === u.id}
                className={`btn btn-outline px-2.5 py-1.5 text-xs whitespace-nowrap ${u.suspended ? "" : "hover:text-danger"}`}
              >
                {busyId === u.id ? (
                  <Spinner className="h-4 w-4" />
                ) : u.suspended ? (
                  t("superadmin_users_reactivate")
                ) : (
                  t("superadmin_users_suspend")
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlobalShell>
  );
}
