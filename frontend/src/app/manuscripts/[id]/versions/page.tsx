"use client";
/* Versions: real history — every accepted fix is a recoverable version. */
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "@/lib/api";
import type { Version } from "@/lib/types";
import { useWorkspace } from "@/lib/ws";
import { Spinner } from "@/components/ui";

export default function VersionsPage() {
  const { ms } = useWorkspace();
  const [versions, setVersions] = useState<Version[] | null>(null);

  useEffect(() => {
    api<Version[]>(`/manuscripts/${ms.id}/versions`)
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [ms.id]);

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-xl font-semibold">Version history</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-6">
          Every accepted fix creates a version with its diff — the AI proposes,
          you decide, nothing is lost.
        </p>
        {versions === null && <Spinner className="h-5 w-5 text-brand" />}
        <div className="flex flex-col gap-3">
          {(versions || []).map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-brand" />
                <span className="font-semibold">Version {v.number}</span>
                <span className="text-inkmut truncate flex-1">{v.label}</span>
                <span className="badge badge-manuscript">readiness {v.readiness}</span>
              </div>
              {(v.diff_summary || []).map((d, i) => (
                <div key={i} className="mt-2.5 text-xs leading-snug">
                  <div className="rounded bg-danger/5 border border-danger/20 px-2.5 py-1.5 line-through text-inkmut">
                    {d.before?.slice(0, 200)}
                  </div>
                  <div className="rounded bg-manuscript-soft border border-manuscript/30 px-2.5 py-1.5 mt-1 text-ink">
                    {d.after?.slice(0, 200)}
                  </div>
                </div>
              ))}
              <div className="text-[11px] text-inkmut mt-2">
                {v.created_at ? new Date(v.created_at).toLocaleString() : ""}
              </div>
            </div>
          ))}
          {versions !== null && versions.length === 0 && (
            <div className="text-sm text-inkmut">No versions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
