"use client";
/* Library: saved papers, grouped by collection; seed a mind map from a selection. */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, ExternalLink, Network, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { SavedPaper } from "@/lib/types";
import GlobalShell from "@/components/GlobalShell";
import { ScopeBadge, Spinner } from "@/components/ui";

export default function LibraryPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<SavedPaper[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<SavedPaper[]>("/library").then(setPapers).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const remove = async (id: string) => {
    await api(`/library/${id}`, { method: "DELETE" });
    load();
  };

  const createMap = async () => {
    if (selected.size < 2 || creating) return;
    setCreating(true);
    try {
      const { id } = await api<{ id: string }>("/mindmaps", {
        method: "POST",
        body: JSON.stringify({ seed_type: "collection", paper_ids: Array.from(selected) }),
      });
      router.push(`/mind-maps/${id}`);
    } catch (e: any) {
      setError(e.message?.slice(0, 160));
      setCreating(false);
    }
  };

  const collections = Array.from(new Set((papers || []).map((p) => p.collection)));

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Library</h1>
            <p className="text-sm text-inkmut mt-0.5">
              Papers you saved from searches and maps.
            </p>
          </div>
          <button
            onClick={createMap}
            disabled={selected.size < 2 || creating}
            className="btn btn-primary"
            title="Select at least 2 papers"
          >
            {creating ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
            Create map from selection ({selected.size})
          </button>
        </div>

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}
        {papers === null && <Spinner className="h-5 w-5 text-brand" />}
        {papers !== null && papers.length === 0 && (
          <div className="text-center py-16 text-inkmut">
            <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <div className="text-sm">
              Nothing saved yet — use <strong>Save</strong> in the Literature Explorer
              or on a map node.
            </div>
          </div>
        )}

        {collections.map((c) => (
          <section key={c} className="mb-6">
            <h2 className="section-title mb-1">{c}</h2>
            <div className="flex flex-col divide-y divide-line/70">
              {(papers || [])
                .filter((p) => p.collection === c)
                .map((p) => (
                  <div key={p.id} className="py-3 flex gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="mt-1 accent-brand"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ScopeBadge scope={p.source_scope} />
                        {p.year && <span className="text-[11px] text-inkmut">{p.year}</span>}
                      </div>
                      <div className="font-medium text-[14px] leading-snug mt-1">{p.title}</div>
                      <div className="text-xs text-inkmut mt-0.5 truncate">
                        {(p.authors || []).slice(0, 4).join(", ")}
                        {p.venue ? ` · ${p.venue.slice(0, 50)}` : ""}
                      </div>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost p-1.5"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => remove(p.id)} className="btn btn-ghost p-1.5 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </GlobalShell>
  );
}
