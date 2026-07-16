"use client";
/* Dashboard: three clear actions, a main "continue working" card, recent work
   in three groups, and an activity feed. Upload lives in a modal. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  FileSearch,
  FileText,
  FileUp,
  Network,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Manuscript, MindMapRecord, SearchLogItem, Version } from "@/lib/types";
import GlobalShell from "@/components/GlobalShell";
import UploadModal from "@/components/UploadModal";
import HeroMap from "@/components/HeroMap";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [mss, setMss] = useState<Manuscript[] | null>(null);
  const [maps, setMaps] = useState<MindMapRecord[]>([]);
  const [searches, setSearches] = useState<SearchLogItem[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Manuscript[]>("/manuscripts")
      .then(async (m) => {
        setMss(m);
        const main = m.find((x) => x.status === "ready");
        if (main) {
          api<Version[]>(`/manuscripts/${main.id}/versions`)
            .then(setVersions)
            .catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
    api<MindMapRecord[]>("/mindmaps").then(setMaps).catch(() => {});
    api<SearchLogItem[]>("/searches/recent").then(setSearches).catch(() => {});
  }, []);

  const main = mss
    ?.filter((m) => m.status === "ready")
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))[0];
  const d: any = main?.readiness_detail || {};

  const activity: { icon: React.ReactNode; text: string; when: string }[] = [
    ...versions.slice(0, 3).map((v) => ({
      icon: <ClipboardCheck className="h-3.5 w-3.5 text-manuscript" />,
      text: v.label,
      when: timeAgo(v.created_at),
    })),
    ...searches.slice(0, 2).map((s) => ({
      icon: <Search className="h-3.5 w-3.5 text-brand" />,
      text: `Searched “${s.query.slice(0, 60)}” (${s.n_results} results)`,
      when: timeAgo(s.created_at),
    })),
    ...maps.slice(0, 2).map((m) => ({
      icon: <Network className="h-3.5 w-3.5 text-pub" />,
      text: `Map created: ${m.title.slice(0, 60)}`,
      when: timeAgo(m.created_at),
    })),
  ].slice(0, 6);

  return (
    <GlobalShell>
      <div className="max-w-4xl mx-auto px-8 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold">PaperClue</h1>
            <p className="text-sm text-inkmut mt-0.5 max-w-md">
              {t("home_tagline")}
            </p>
          </div>
          <div className="hidden lg:block shrink-0">
            <HeroMap />
          </div>
        </div>

        {/* Three clear actions */}
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="card card-hover p-4 text-left hover:border-brand group"
          >
            <FileUp className="h-5 w-5 text-brand" />
            <div className="font-semibold mt-2 text-sm">{t("action_upload_title")}</div>
            <div className="text-xs text-inkmut mt-0.5">
              {t("action_upload_desc")}
            </div>
          </button>
          <Link href="/discover" className="card card-hover p-4 hover:border-brand">
            <FileSearch className="h-5 w-5 text-brand" />
            <div className="font-semibold mt-2 text-sm">{t("action_explore_title")}</div>
            <div className="text-xs text-inkmut mt-0.5">
              {t("action_explore_desc")}
            </div>
          </Link>
          <Link href="/mind-maps" className="card card-hover p-4 hover:border-brand">
            <Network className="h-5 w-5 text-brand" />
            <div className="font-semibold mt-2 text-sm">{t("action_map_title")}</div>
            <div className="text-xs text-inkmut mt-0.5">
              {t("action_map_desc")}
            </div>
          </Link>
        </div>

        {error && <div className="card p-4 text-sm text-danger">API unreachable — {error}</div>}
        {mss === null && !error && (
          <div className="flex items-center gap-2 text-inkmut text-sm">
            <Spinner /> {t("loading")}
          </div>
        )}

        {/* Continue working */}
        {main && (
          <section>
            <h2 className="section-title mb-2">{t("continue_working")}</h2>
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-serif text-lg font-semibold leading-snug truncate">
                    {main.title}
                  </div>
                  <div className="text-xs text-inkmut mt-0.5">
                    {main.field_of_study || "Manuscript"} · {main.n_pages} pages ·
                    last activity {timeAgo(main.updated_at)}
                  </div>
                </div>
                <span className="badge badge-manuscript shrink-0">{t("badge_private")}</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-inkmut">{t("submission_readiness")}</span>
                  <span className="font-semibold text-ink">{main.readiness}/100</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-700"
                    style={{ width: `${main.readiness}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
                <span className={`badge ${main.has_insight ? "badge-manuscript" : "badge-ai"}`}>
                  {t("insight_label")} {main.has_insight ? "✓" : t("pending")}
                </span>
                {d.review_done ? (
                  <span className={`badge ${d.open_issues === 0 ? "badge-manuscript" : "badge-university"}`}>
                    {d.open_issues} {d.open_issues !== 1 ? t("open_finding_plural") : t("open_finding")}
                  </span>
                ) : (
                  <span className="badge badge-ai">{t("review_pending")}</span>
                )}
                {d.refs_total ? (
                  <span className={`badge ${d.refs_verified === d.refs_total ? "badge-manuscript" : "badge-university"}`}>
                    {d.refs_verified}/{d.refs_total} {t("references_verified_label")}
                  </span>
                ) : null}
              </div>

              <div className="flex gap-2 mt-4">
                <Link href={`/manuscripts/${main.id}/overview`} className="btn btn-primary">
                  {t("continue_working")}
                </Link>
                <Link href={`/manuscripts/${main.id}/review?run=1`} className="btn btn-outline">
                  {t("run_review")}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recent work: three groups */}
        <section>
          <h2 className="section-title mb-2">{t("recent_work")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                <FileText className="h-3.5 w-3.5 text-manuscript" /> {t("manuscripts_label")}
              </div>
              <div className="flex flex-col divide-y divide-line/60">
                {(mss || []).slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-start gap-1 group">
                    <Link
                      href={`/manuscripts/${m.id}/overview`}
                      className="flex-1 min-w-0 py-2 text-[13px] leading-snug hover:text-brand-deep"
                    >
                      <span className="line-clamp-2 block">{m.title}</span>
                      <span className="text-[11px] text-inkmut">
                        {m.status === "ready" ? `readiness ${m.readiness}` : m.status}
                        {" · "}{timeAgo(m.updated_at)}
                      </span>
                    </Link>
                    <button
                      onClick={async () => {
                        await api(`/manuscripts/${m.id}`, { method: "DELETE" });
                        setMss((prev) => (prev || []).filter((x) => x.id !== m.id));
                      }}
                      className="btn btn-ghost p-1 mt-2 opacity-0 group-hover:opacity-100 hover:text-danger"
                      title="Delete this manuscript (PDF, index and history)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {(mss || []).length === 0 && (
                  <div className="py-2 text-xs text-inkmut">{t("no_manuscripts")}</div>
                )}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                <Search className="h-3.5 w-3.5 text-brand" /> {t("literature_searches")}
              </div>
              <div className="flex flex-col divide-y divide-line/60">
                {searches.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/discover?q=${encodeURIComponent(s.query)}`}
                    className="py-2 text-[13px] leading-snug hover:text-brand-deep"
                  >
                    <span className="line-clamp-2">{s.query}</span>
                    <span className="text-[11px] text-inkmut">
                      {s.n_results} results · {timeAgo(s.created_at)}
                    </span>
                  </Link>
                ))}
                {searches.length === 0 && (
                  <div className="py-2 text-xs text-inkmut">{t("no_searches")}</div>
                )}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                <Network className="h-3.5 w-3.5 text-pub" /> {t("mind_maps_label")}
              </div>
              <div className="flex flex-col divide-y divide-line/60">
                {maps.slice(0, 4).map((m) => (
                  <Link
                    key={m.id}
                    href={`/mind-maps/${m.id}`}
                    className="py-2 text-[13px] leading-snug hover:text-brand-deep"
                  >
                    <span className="line-clamp-2">{m.title}</span>
                    <span className="text-[11px] text-inkmut">
                      {m.seed_type} · {m.n_nodes ?? "…"} nodes · {timeAgo(m.created_at)}
                    </span>
                  </Link>
                ))}
                {maps.length === 0 && (
                  <div className="py-2 text-xs text-inkmut">{t("no_maps")}</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Activity */}
        {activity.length > 0 && (
          <section>
            <h2 className="section-title mb-2">{t("recent_activity")}</h2>
            <div className="card px-4 divide-y divide-line/60">
              {activity.map((a, i) => (
                <div key={i} className="py-2.5 flex items-center gap-2.5 text-[13px]">
                  {a.icon}
                  <span className="flex-1 truncate">{a.text}</span>
                  <span className="text-[11px] text-inkmut shrink-0">{a.when}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </GlobalShell>
  );
}
