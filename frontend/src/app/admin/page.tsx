"use client";
/* Institution admin panel: manage teachers/students in your own institution.
   No visibility into their manuscripts, scores, or content — membership only. */
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Trash2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  role: "teacher" | "student";
}

export default function AdminPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { full_name: string; email: string; role: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Member[]>("/admin/members")
      .then((rows) => {
        setMembers(rows);
        const d: typeof drafts = {};
        for (const m of rows) d[m.id] = { full_name: m.full_name || "", email: m.email, role: m.role };
        setDrafts(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const setDraft = (id: string, field: string, value: string) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (m: Member) => {
    setSavingId(m.id);
    setError(null);
    const d = drafts[m.id];
    try {
      if (d.full_name !== (m.full_name || "") || d.role !== m.role) {
        await api(`/admin/members/${m.id}`, {
          method: "PATCH",
          body: JSON.stringify({ full_name: d.full_name, role: d.role }),
        });
      }
      if (d.email !== m.email) {
        await api(`/admin/members/${m.id}/email`, {
          method: "PATCH",
          body: JSON.stringify({ email: d.email }),
        });
      }
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const exclude = async (m: Member) => {
    if (!confirm(`Remove ${m.full_name || m.email} from your institution?`)) return;
    setError(null);
    try {
      await api(`/admin/members/${m.id}/exclude`, { method: "POST" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (ready && profile && profile.role !== "institution_admin") {
    return (
      <GlobalShell>
        <div className="max-w-3xl mx-auto px-8 py-16 text-center text-inkmut">
          <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-40" />
          {t("admin_only")}
        </div>
      </GlobalShell>
    );
  }

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">{t("admin_title")}</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">
          {profile?.institution_name || t("admin_your_institution")} {t("admin_subtitle_suffix")}
        </p>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {members === null && <Spinner className="h-5 w-5 text-brand" />}
        {members !== null && members.length === 0 && (
          <div className="text-center py-16 text-inkmut text-sm">{t("admin_no_members")}</div>
        )}

        <div className="flex flex-col gap-3">
          {(members || []).map((m) => {
            const d = drafts[m.id] || { full_name: "", email: "", role: m.role };
            return (
              <div key={m.id} className="card p-4 flex items-center gap-3">
                <input
                  value={d.full_name}
                  onChange={(e) => setDraft(m.id, "full_name", e.target.value)}
                  className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm w-40"
                  placeholder={t("admin_name_placeholder")}
                />
                <input
                  value={d.email}
                  onChange={(e) => setDraft(m.id, "email", e.target.value)}
                  className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm flex-1 min-w-0"
                  placeholder={t("admin_email_placeholder")}
                />
                <select
                  value={d.role}
                  onChange={(e) => setDraft(m.id, "role", e.target.value)}
                  className="rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-2.5 py-1.5 text-sm"
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
                <button
                  onClick={() => save(m)}
                  disabled={savingId === m.id}
                  className="btn btn-primary px-2.5 py-1.5"
                  title="Save changes"
                >
                  {savingId === m.id ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => exclude(m)}
                  className="btn btn-outline px-2.5 py-1.5 hover:text-danger"
                  title="Exclude from institution"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </GlobalShell>
  );
}
