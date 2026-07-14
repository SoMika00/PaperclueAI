"use client";
/* Manuscript mind map: finds (or creates) the map seeded by this manuscript
   and renders the shared canvas — Gap Finder included. */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { MindMapRecord } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { Spinner } from "@/components/ui";

const MindMapCanvas = dynamic(() => import("@/components/MindMapCanvas"), { ssr: false });

export default function ManuscriptMapPage() {
  const { ms } = useWorkspace();
  const [map, setMap] = useState<MindMapRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
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

  const create = useCallback(async () => {
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

  useEffect(() => {
    stopped.current = false;
    (async () => {
      try {
        const existing = await api<MindMapRecord[]>(`/mindmaps?manuscript_id=${ms.id}`);
        const ready = existing.find((m) => m.status !== "error");
        if (ready) poll(ready.id);
        else create();
      } catch {
        create();
      }
    })();
    return () => {
      stopped.current = true;
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms.id]);

  return (
    <div className="h-full relative">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 card p-3 text-xs text-danger flex items-center gap-2">
          {error}
          <button onClick={create} className="btn btn-outline text-xs py-0.5">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      {!error && (!map || map.status === "building") && (
        <div className="h-full grid place-items-center text-inkmut">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="h-6 w-6 text-brand" />
            <span className="text-sm">
              Positioning your manuscript in the research landscape…
            </span>
          </div>
        </div>
      )}
      {map?.status === "error" && (
        <div className="h-full grid place-items-center">
          <div className="card p-4 text-sm text-danger flex items-center gap-3">
            {map.error}
            <button onClick={create} className="btn btn-outline text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      )}
      {map?.status === "ready" && map.graph && (
        <>
          <MindMapCanvas
            mapId={map.id}
            graph={map.graph}
            onGraphChange={(g) => setMap({ ...map, graph: g })}
          />
          <button
            onClick={create}
            className="absolute top-4 right-4 z-10 btn btn-outline bg-paper text-xs"
            title="Rebuild the map"
          >
            <RefreshCw className="h-3 w-3" /> Rebuild
          </button>
        </>
      )}
    </div>
  );
}
