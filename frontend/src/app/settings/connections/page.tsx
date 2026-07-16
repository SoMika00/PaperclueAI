"use client";
/* Data Source Connection: configure and test a SOURCE_DATABASE_* connection.
   Nothing here is persisted server-side — the panel only calls a stateless
   test endpoint and lets you copy the resulting .env snippet, since writing
   secrets to disk from a web form needs its own auth story. */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Database,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";

type DbType = "postgres" | "mysql" | "sqlite" | "mssql";

interface FormState {
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

const DEFAULT_PORTS: Record<DbType, string> = {
  postgres: "5432",
  mysql: "3306",
  sqlite: "",
  mssql: "1433",
};

const INITIAL: FormState = {
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

interface CurrentConfig {
  configured: boolean;
  database_type?: string;
  database_host?: string | null;
  database_name?: string | null;
  secure?: boolean;
}

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

function envSnippet(f: FormState): string {
  if (f.database_url.trim()) {
    return `SOURCE_DATABASE_TYPE=${f.database_type}\nSOURCE_DATABASE_URL=${f.database_url}`;
  }
  const lines = [
    `SOURCE_DATABASE_TYPE=${f.database_type}`,
    `SOURCE_DATABASE_HOST=${f.database_host}`,
    `SOURCE_DATABASE_PORT=${f.database_port}`,
    `SOURCE_DATABASE_NAME=${f.database_name}`,
    `SOURCE_DATABASE_USER=${f.database_user}`,
    `SOURCE_DATABASE_PASSWORD=${f.database_password}`,
    `SOURCE_DATABASE_SSL_MODE=${f.database_ssl_mode}`,
  ];
  if (f.database_ssl_ca) lines.push(`SOURCE_DATABASE_SSL_CA=${f.database_ssl_ca}`);
  if (f.database_ssl_cert) lines.push(`SOURCE_DATABASE_SSL_CERT=${f.database_ssl_cert}`);
  if (f.database_ssl_key) lines.push(`SOURCE_DATABASE_SSL_KEY=${f.database_ssl_key}`);
  if (f.database_type === "mssql") {
    lines.push(`SOURCE_DATABASE_TRUST_SERVER_CERTIFICATE=${f.database_trust_server_certificate}`);
  }
  return lines.join("\n");
}

export default function ConnectionsSettingsPage() {
  const [current, setCurrent] = useState<CurrentConfig | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [checkingCurrent, setCheckingCurrent] = useState(true);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [useUrl, setUseUrl] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCurrent = useCallback(() => {
    setCheckingCurrent(true);
    setCurrentError(null);
    api<CurrentConfig>("/connections/config")
      .then(setCurrent)
      .catch((e) => setCurrentError(e.message?.slice(0, 200)))
      .finally(() => setCheckingCurrent(false));
  }, []);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

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
      const raw = (e.message || "").replace(/^\d+:\s*/, "");
      let message = raw;
      try {
        message = JSON.parse(raw).detail || raw;
      } catch {
        /* not JSON, use raw text */
      }
      setResult({ ok: false, message: message.slice(0, 300) || "Connection failed" });
    } finally {
      setTesting(false);
    }
  }, [form, useUrl]);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(envSnippet(form));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <GlobalShell>
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-deep" />
            <h1 className="font-serif font-semibold text-lg">Data Source Connection</h1>
          </div>
          <p className="text-[11px] text-inkmut mt-0.5">
            Configure and test the <code className="text-ink/70">SOURCE_DATABASE_*</code> connection used to
            reach an external database. Values entered here are only used for a live test — nothing is saved
            server-side. Copy the generated snippet into your <code className="text-ink/70">.env</code> file
            and restart the API to apply it.
          </p>
        </div>

        {/* Current server-side status */}
        <div className="card p-3.5">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Currently configured</span>
            <button onClick={loadCurrent} className="btn btn-ghost text-[11px] px-2 py-1">
              Refresh
            </button>
          </div>
          {checkingCurrent && (
            <div className="flex items-center gap-2 text-xs text-inkmut mt-2">
              <Spinner className="h-3.5 w-3.5" /> Checking…
            </div>
          )}
          {!checkingCurrent && current?.configured && (
            <div className="flex items-center gap-2 text-sm mt-2">
              <CheckCircle2 className="h-4 w-4 text-manuscript shrink-0" />
              <span>
                <strong className="font-medium">{current.database_type}</strong>
                {current.database_host && ` @ ${current.database_host}`}
                {current.database_name && `/${current.database_name}`}
              </span>
            </div>
          )}
          {!checkingCurrent && current && !current.configured && (
            <div className="flex items-center gap-2 text-xs text-inkmut mt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> No SOURCE_DATABASE_* configured yet — use the
              form below to test one, then add it to your .env.
            </div>
          )}
          {!checkingCurrent && currentError && (
            <div className="flex items-center gap-2 text-xs text-danger mt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {currentError}
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
            <button onClick={runTest} disabled={testing} className="btn btn-primary">
              {testing ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              Test connection
            </button>
            <button onClick={copySnippet} className="btn btn-outline">
              {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy .env snippet"}
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
