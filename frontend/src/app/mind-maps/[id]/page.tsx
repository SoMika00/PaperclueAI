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

const MindMapCanvas = dynamic(() => import("@/components/MindMapCanvas"), { ssr: false });

function DeleteButton({ mapId }: { mapId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await api(`/mindmaps/${mapId}`, { method: "DELETE" });
        router.push("/mind-maps");
      }}
      className="btn btn-ghost hover:text-danger"
      title="Delete this map"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export default function MindMapViewPage() {
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
        <div className="flex items-center gap-3 px-5 py-3 border-b border-line bg-paper">
          <Link href="/mind-maps" className="text-inkmut hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="font-serif font-semibold truncate">{map?.title || "…"}</div>
            <div className="text-[11px] text-inkmut">
              {map ? `${map.seed_type} map · ${map.status}` : ""}
              {map && !map.saved && " · draft — save it to keep it"}
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
                    <BookmarkCheck className="h-4 w-4 text-manuscript" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Save map
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
                  Retrieving, clustering and explaining connections…
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
