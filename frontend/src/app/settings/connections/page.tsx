"use client";
/* Data Source Connection: configure, test and save a SOURCE_DATABASE_*
   connection. Saved connections are persisted server-side (encrypted at
   rest) and listed below — institution admins only. */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";

type DbType = "postgres" | "mysql" | "sqlite" | "mssql";

interface FormState {
  name: string;
  database_type: DbType;
  database_url: string;
  database_host: string;
  database_port: string;
  database_name: string;
  database_user: string;
  database_password: string;
  database_ssl_mode: string;
  database_ssl_ca: string;
  database_ssl_cert: string;
  database_ssl_key: string;
  database_trust_server_certificate: string;
}

interface SavedConnection {
  id: string;
  name: string;
  database_type: string;
  uses_url: boolean;
  database_host: string | null;
  database_name: string | null;
  database_user: string | null;
  status: "ok" | "error" | "untested";
  last_error: string | null;
  last_tested_at: string | null;
  created_at: string;
}

const DEFAULT_PORTS: Record<DbType, string> = {
  postgres: "5432",
  mysql: "3306",
  sqlite: "",
  mssql: "1433",
};

const INITIAL: FormState = {
  name: "",
  database_type: "postgres",
  database_url: "",
  database_host: "",
  database_port: DEFAULT_PORTS.postgres,
  database_name: "",
  database_user: "",
  database_password: "",
  database_ssl_mode: "prefer",
  database_ssl_ca: "",
  database_ssl_cert: "",
  database_ssl_key: "",
  database_trust_server_certificate: "false",
};

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-50";
const labelCls = "text-[11px] font-semibold text-inkmut uppercase tracking-wide";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function parseApiError(e: any): string {
  const raw = (e.message || "").replace(/^\d+:\s*/, "");
  let message = raw;
  try {
    message = JSON.parse(raw).detail || raw;
  } catch {
    /* not JSON, use raw text */
  }
  return message.slice(0, 300) || "Something went wrong";
}

function statusBadge(status: SavedConnection["status"]) {
  if (status === "ok") return { cls: "bg-manuscript-soft border-manuscript/30 text-manuscript", key: "connections_status_ok" as const };
  if (status === "error") return { cls: "bg-danger/5 border-danger/20 text-danger", key: "connections_status_error" as const };
  return { cls: "bg-surface2 border-line text-inkmut", key: "connections_status_untested" as const };
}

export default function ConnectionsSettingsPage() {
  const { profile, ready } = useAuth();
  const { t } = useLocale();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [useUrl, setUseUrl] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [saved, setSaved] = useState<SavedConnection[] | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSaved = useCallback(() => {
    setSavedError(null);
    api<SavedConnection[]>("/connections")
      .then(setSaved)
      .catch((e) => setSavedError(parseApiError(e)));
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onTypeChange = (type: DbType) => {
    setForm((f) => ({
      ...f,
      database_type: type,
      database_port: f.database_port === DEFAULT_PORTS[f.database_type] ? DEFAULT_PORTS[type] : f.database_port,
      database_ssl_mode: type === "postgres" ? "prefer" : "false",
    }));
  };

  const runTest = useCallback(async () => {
    setTesting(true);
    setResult(null);
    try {
      const body = useUrl ? { database_type: form.database_type, database_url: form.database_url } : form;
      const res = await api<{ status: string; database_type: string; database_host: string | null }>(
        "/connections/test",
        { method: "POST", body: JSON.stringify(body) }
      );
      setResult({
        ok: true,
        message: `Connected to ${res.database_type}${res.database_host ? ` @ ${res.database_host}` : ""}.`,
      });
    } catch (e: any) {
      setResult({ ok: false, message: parseApiError(e) });
    } finally {
      setTesting(false);
    }
  }, [form, useUrl]);

  const saveConnection = useCallback(async () => {
    setSaving(true);
    setResult(null);
    try {
      const body = useUrl
        ? { name: form.name, database_type: form.database_type, database_url: form.database_url }
        : form;
      await api("/connections", { method: "POST", body: JSON.stringify(body) });
      setForm(INITIAL);
      setUseUrl(false);
      loadSaved();
    } catch (e: any) {
      setResult({ ok: false, message: parseApiError(e) });
    } finally {
      setSaving(false);
    }
  }, [form, useUrl, loadSaved]);

  const retestConnection = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await api(`/connections/${id}/test`, { method: "POST" });
        loadSaved();
      } catch {
        /* row-level error surfaces via its own status/last_error on refresh */
      } finally {
        setBusyId(null);
      }
    },
    [loadSaved]
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      if (!window.confirm(t("connections_delete_confirm"))) return;
      setBusyId(id);
      try {
        await api(`/connections/${id}`, { method: "DELETE" });
        loadSaved();
      } catch (e: any) {
        setSavedError(parseApiError(e));
      } finally {
        setBusyId(null);
      }
    },
    [loadSaved, t]
  );

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
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-deep" />
            <h1 className="font-serif font-semibold text-lg">Data Source Connection</h1>
          </div>
          <p className="text-[11px] text-inkmut mt-0.5">
            Test and save connections to external databases. Saved connections are encrypted at rest and
            listed below.
          </p>
        </div>

        {/* Saved connections */}
        <div className="card p-3.5">
          <div className="flex items-center justify-between">
            <span className={labelCls}>{t("connections_saved_title")}</span>
            <button onClick={loadSaved} className="btn btn-ghost text-[11px] px-2 py-1">
              Refresh
            </button>
          </div>
          {savedError && (
            <div className="flex items-center gap-2 text-xs text-danger mt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {savedError}
            </div>
          )}
          {saved === null && !savedError && (
            <div className="flex items-center gap-2 text-xs text-inkmut mt-2">
              <Spinner className="h-3.5 w-3.5" /> Loading…
            </div>
          )}
          {saved && saved.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-inkmut mt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {t("connections_empty")}
            </div>
          )}
          {saved && saved.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {saved.map((c) => {
                const badge = statusBadge(c.status);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${badge.cls}`}>
                          {t(badge.key)}
                        </span>
                      </div>
                      <div className="text-[11px] text-inkmut truncate">
                        {c.database_type}
                        {c.uses_url ? " · via URL" : `${c.database_host ? ` @ ${c.database_host}` : ""}${c.database_name ? `/${c.database_name}` : ""}`}
                        {c.last_tested_at && ` · ${t("connections_last_tested")}: ${new Date(c.last_tested_at).toLocaleString()}`}
                      </div>
                      {c.status === "error" && c.last_error && (
                        <div className="text-[11px] text-danger truncate">{c.last_error}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => retestConnection(c.id)}
                        disabled={busyId === c.id}
                        title={t("connections_retest")}
                        className="btn btn-ghost p-1.5"
                      >
                        {busyId === c.id ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteConnection(c.id)}
                        disabled={busyId === c.id}
                        title="Delete"
                        className="btn btn-ghost p-1.5 text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={labelCls}>New connection</span>
            <label className="flex items-center gap-1.5 text-[11px] text-inkmut">
              <input type="checkbox" checked={useUrl} onChange={(e) => setUseUrl(e.target.checked)} />
              Use a connection URL instead
            </label>
          </div>

          <Field label={t("connections_name_label")}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Production Postgres"
              className={inputCls}
            />
          </Field>

          <Field label="Database type">
            <select
              value={form.database_type}
              onChange={(e) => onTypeChange(e.target.value as DbType)}
              className={inputCls}
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
              <option value="sqlite">SQLite</option>
            </select>
          </Field>

          {useUrl ? (
            <Field label="SOURCE_DATABASE_URL">
              <input
                value={form.database_url}
                onChange={(e) => set("database_url", e.target.value)}
                placeholder="postgresql+psycopg2://user:pass@host:5432/db"
                className={inputCls}
              />
            </Field>
          ) : form.database_type === "sqlite" ? (
            <Field label="SOURCE_DATABASE_NAME (file path, blank = in-memory)">
              <input
                value={form.database_name}
                onChange={(e) => set("database_name", e.target.value)}
                placeholder="/data/source.db"
                className={inputCls}
              />
            </Field>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="Host">
                    <input
                      value={form.database_host}
                      onChange={(e) => set("database_host", e.target.value)}
                      placeholder="db.internal"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Port">
                  <input
                    value={form.database_port}
                    onChange={(e) => set("database_port", e.target.value)}
                    placeholder={DEFAULT_PORTS[form.database_type]}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Database name">
                <input
                  value={form.database_name}
                  onChange={(e) => set("database_name", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="User">
                  <input
                    value={form.database_user}
                    onChange={(e) => set("database_user", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    value={form.database_password}
                    onChange={(e) => set("database_password", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-inkmut select-none">SSL / TLS options</summary>
                <div className="flex flex-col gap-2 mt-2">
                  <Field label={form.database_type === "mssql" ? "Encrypt" : "SSL mode"}>
                    <select
                      value={form.database_ssl_mode}
                      onChange={(e) => set("database_ssl_mode", e.target.value)}
                      className={inputCls}
                    >
                      {form.database_type === "postgres" && (
                        <>
                          <option value="disable">disable</option>
                          <option value="prefer">prefer</option>
                          <option value="require">require</option>
                          <option value="verify-ca">verify-ca</option>
                          <option value="verify-full">verify-full</option>
                        </>
                      )}
                      {form.database_type !== "postgres" && (
                        <>
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </>
                      )}
                    </select>
                  </Field>
                  <Field label="SSL CA path">
                    <input
                      value={form.database_ssl_ca}
                      onChange={(e) => set("database_ssl_ca", e.target.value)}
                      placeholder="/certs/ca.pem"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="SSL cert path">
                      <input
                        value={form.database_ssl_cert}
                        onChange={(e) => set("database_ssl_cert", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="SSL key path">
                      <input
                        value={form.database_ssl_key}
                        onChange={(e) => set("database_ssl_key", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  {form.database_type === "mssql" && (
                    <label className="flex items-center gap-1.5 text-[11px] text-inkmut">
                      <input
                        type="checkbox"
                        checked={form.database_trust_server_certificate === "true"}
                        onChange={(e) =>
                          set("database_trust_server_certificate", e.target.checked ? "true" : "false")
                        }
                      />
                      Trust server certificate
                    </label>
                  )}
                </div>
              </details>
            </>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={runTest} disabled={testing} className="btn btn-outline">
              {testing ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              Test connection
            </button>
            <button onClick={saveConnection} disabled={saving || !form.name.trim()} className="btn btn-primary">
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {t("connections_save")}
            </button>
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                result.ok
                  ? "bg-manuscript-soft border-manuscript/30 text-manuscript"
                  : "bg-danger/5 border-danger/20 text-danger"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{result.message}</span>
            </div>
          )}
        </div>
      </div>
    </GlobalShell>
  );
}
