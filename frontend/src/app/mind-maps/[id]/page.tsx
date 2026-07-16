"use client";
/* Map viewer: polls while building, then renders the shared canvas. */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { MindMapRecord } from "@/lib/types";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

const MindMapCanvas = dynamic(() => import("@/components/MindMapCanvas"), { ssr: false });

function DeleteButton({ mapId }: { mapId: string }) {
  const router = useRouter();
  const { t } = useLocale();
  return (
    <button
      onClick={async () => {
        await api(`/mindmaps/${mapId}`, { method: "DELETE" });
        router.push("/mind-maps");
      }}
      className="btn btn-ghost hover:text-danger"
      title={t("delete_map_title")}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export default function MindMapViewPage() {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const [map, setMap] = useState<MindMapRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSave = async () => {
    if (!map) return;
    const r = await api<MindMapRecord>(`/mindmaps/${map.id}`, {
      method: "PATCH",
      body: JSON.stringify({ saved: !map.saved }),
    });
    setMap({ ...map, saved: r.saved });
  };

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const m = await api<MindMapRecord>(`/mindmaps/${params.id}`);
        if (stop) return;
        setMap(m);
        if (m.status === "building") timer = setTimeout(tick, 2500);
      } catch (e: any) {
        if (!stop) setError(e.message);
      }
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [params.id]);

  return (
    <GlobalShell>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-line dark:border-dark-line bg-paper dark:bg-dark-surface">
          <Link href="/mind-maps" className="text-inkmut hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="font-serif font-semibold truncate">{map?.title || "…"}</div>
            <div className="text-[11px] text-inkmut">
              {map ? `${map.seed_type} ${t("map_status_label")} · ${map.status}` : ""}
              {map && !map.saved && ` · ${t("draft_note")}`}
            </div>
          </div>
          {map?.status === "ready" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleSave}
                className={`btn ${map.saved ? "btn-outline" : "btn-primary"}`}
              >
                {map.saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-manuscript" /> {t("saved_button")}
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> {t("save_map_button")}
                  </>
                )}
              </button>
              <DeleteButton mapId={map.id} />
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0">
          {error && <div className="p-6 text-sm text-danger">{error}</div>}
          {!error && (!map || map.status === "building") && (
            <div className="h-full grid place-items-center text-inkmut">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="h-6 w-6 text-brand" />
                <span className="text-sm">
                  {t("building_map_text")}
                </span>
              </div>
            </div>
          )}
          {map?.status === "error" && (
            <div className="p-6 text-sm text-danger">{map.error}</div>
          )}
          {map?.status === "ready" && map.graph && (
            <MindMapCanvas
              mapId={map.id}
              graph={map.graph}
              onGraphChange={(g) => setMap({ ...map, graph: g })}
            />
          )}
        </div>
      </div>
    </GlobalShell>
  );
}
