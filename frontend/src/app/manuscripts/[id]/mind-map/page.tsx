"use client";
/* Manuscript mind map: nothing is generated behind your back — you press
   Generate, you inspect, you decide to save (or it stays a draft). */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Network, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { MindMapRecord } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { EmptyState, Spinner } from "@/components/ui";
import { useLocale } from "@/lib/i18n";

const MindMapCanvas = dynamic(() => import("@/components/MindMapCanvas"), { ssr: false });

export default function ManuscriptMapPage() {
  const { t } = useLocale();
  const { ms } = useWorkspace();
  const [map, setMap] = useState<MindMapRecord | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopped = useRef(false);

  const poll = useCallback(async (id: string) => {
    try {
      const m = await api<MindMapRecord>(`/mindmaps/${id}`);
      if (stopped.current) return;
      setMap(m);
      if (m.status === "building") timer.current = setTimeout(() => poll(id), 2500);
    } catch (e: any) {
      if (!stopped.current) setError(e.message);
    }
  }, []);

  const generate = useCallback(async () => {
    setMap(null);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/mindmaps", {
        method: "POST",
        body: JSON.stringify({ seed_type: "manuscript", manuscript_id: ms.id }),
      });
      poll(id);
    } catch (e: any) {
      setError(e.message?.slice(0, 200));
    }
  }, [ms.id, poll]);

  // Load an existing map for this manuscript if one exists — never create one.
  useEffect(() => {
    stopped.current = false;
    (async () => {
      try {
        const existing = await api<MindMapRecord[]>(`/mindmaps?manuscript_id=${ms.id}`);
        const usable = existing.find((m) => m.status !== "error");
        if (usable) poll(usable.id);
      } catch {
        /* show the generate state */
      } finally {
        setChecked(true);
      }
    })();
    return () => {
      stopped.current = true;
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms.id]);

  const toggleSave = async () => {
    if (!map) return;
    const r = await api<MindMapRecord>(`/mindmaps/${map.id}`, {
      method: "PATCH",
      body: JSON.stringify({ saved: !map.saved }),
    });
    setMap({ ...map, saved: r.saved });
  };

  const remove = async () => {
    if (!map) return;
    await api(`/mindmaps/${map.id}`, { method: "DELETE" });
    setMap(null);
  };

  if (!checked)
    return (
      <div className="h-full grid place-items-center text-inkmut">
        <Spinner className="h-5 w-5 text-brand" />
      </div>
    );

  if (!map)
    return (
      <div className="h-full grid place-items-center">
        <EmptyState
          icon={<Network className="h-10 w-10" />}
          title={t("position_manuscript_title")}
          sub={t("position_manuscript_sub")}
        >
          {error && <div className="text-xs text-danger mb-2">{error}</div>}
          <button onClick={generate} className="btn btn-primary mt-2">
            <Network className="h-4 w-4" /> {t("generate_research_map")}
          </button>
        </EmptyState>
      </div>
    );

  return (
    <div className="h-full relative">
      {map.status === "building" && (
        <div className="h-full grid place-items-center text-inkmut">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="h-6 w-6 text-brand" />
            <span className="text-sm">
              {t("positioning_manuscript")}
            </span>
          </div>
        </div>
      )}
      {map.status === "error" && (
        <div className="h-full grid place-items-center">
          <div className="card p-4 text-sm text-danger flex items-center gap-3">
            {map.error}
            <button onClick={generate} className="btn btn-outline text-xs">
              <RefreshCw className="h-3 w-3" /> {t("retry_button")}
            </button>
          </div>
        </div>
      )}
      {map.status === "ready" && map.graph && (
        <>
          <MindMapCanvas
            mapId={map.id}
            graph={map.graph}
            onGraphChange={(g) => setMap({ ...map, graph: g })}
          />
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={toggleSave}
              className={`btn bg-paper ${map.saved ? "btn-outline" : "btn-primary"}`}
            >
              {map.saved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 text-manuscript" /> {t("saved_button")}
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" /> {t("save_map_button")}
                </>
              )}
            </button>
            <button onClick={generate} className="btn btn-outline bg-paper text-xs" title={t("rebuild_button")}>
              <RefreshCw className="h-3 w-3" /> {t("rebuild_button")}
            </button>
            <button
              onClick={remove}
              className="btn btn-ghost bg-paper hover:text-danger"
              title={t("delete_map_title")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
