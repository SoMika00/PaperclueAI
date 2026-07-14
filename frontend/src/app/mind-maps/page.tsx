"use client";
/* Mind Maps home: create a research map from a question, a manuscript, or a
   collection — plus the list of existing maps. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, FolderOpen, HelpCircle, Network, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Manuscript, MindMapRecord, SavedPaper } from "@/lib/types";
import GlobalShell from "@/components/GlobalShell";
import { Spinner } from "@/components/ui";

type Mode = "question" | "manuscript" | "collection" | null;

export default function MindMapsPage() {
  const router = useRouter();
  const [maps, setMaps] = useState<MindMapRecord[] | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [question, setQuestion] = useState("");
  const [mss, setMss] = useState<Manuscript[]>([]);
  const [msId, setMsId] = useState("");
  const [library, setLibrary] = useState<SavedPaper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMaps = () =>
    api<MindMapRecord[]>("/mindmaps").then(setMaps).catch(() => setMaps([]));

  useEffect(() => {
    loadMaps();
    api<Manuscript[]>("/manuscripts")
      .then((m) => {
        const ready = m.filter((x) => x.status === "ready");
        setMss(ready);
        if (ready[0]) setMsId(ready[0].id);
      })
      .catch(() => {});
    api<SavedPaper[]>("/library").then(setLibrary).catch(() => {});
  }, []);

  const create = async () => {
    if (creating) return;
    setError(null);
    let body: any = null;
    if (mode === "question" && question.trim())
      body = { seed_type: "question", question: question.trim() };
    if (mode === "manuscript" && msId)
      body = { seed_type: "manuscript", manuscript_id: msId };
    if (mode === "collection" && selected.size >= 2)
      body = { seed_type: "collection", paper_ids: Array.from(selected) };
    if (!body) return;
    setCreating(true);
    try {
      const { id } = await api<{ id: string }>("/mindmaps", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/mind-maps/${id}`);
    } catch (e: any) {
      setError(e.message?.slice(0, 160));
      setCreating(false);
    }
  };

  const MODES = [
    {
      id: "question" as Mode,
      icon: <HelpCircle className="h-5 w-5" />,
      title: "From a research question",
      sub: "Explore an academic topic from scratch",
    },
    {
      id: "manuscript" as Mode,
      icon: <FileText className="h-5 w-5" />,
      title: "From a manuscript",
      sub: "Position your paper inside existing research",
    },
    {
      id: "collection" as Mode,
      icon: <FolderOpen className="h-5 w-5" />,
      title: "From a collection",
      sub: "Organize selected papers into themes",
    },
  ];

  return (
    <GlobalShell>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="font-serif text-2xl font-semibold">Create a research map</h1>
        <p className="text-sm text-inkmut mt-0.5 mb-5">
          Map the literature around a seed, reveal research families and missing
          references.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(mode === m.id ? null : m.id)}
              className={`card card-hover p-4 text-left ${
                mode === m.id ? "border-brand ring-1 ring-brand" : "hover:border-brand"
              }`}
            >
              <span className="text-brand">{m.icon}</span>
              <div className="font-semibold mt-2 text-sm">{m.title}</div>
              <div className="text-xs text-inkmut mt-0.5">{m.sub}</div>
            </button>
          ))}
        </div>

        {mode === "question" && (
          <div className="card p-4 mb-4 flex flex-col gap-2">
            <label className="section-title">Research question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="e.g. How do RAG systems handle conflicting retrieved evidence?"
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand resize-none"
            />
            <button
              onClick={create}
              disabled={!question.trim() || creating}
              className="btn btn-primary self-start"
            >
              {creating ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
              Build map
            </button>
          </div>
        )}

        {mode === "manuscript" && (
          <div className="card p-4 mb-4 flex flex-col gap-2">
            <label className="section-title">Manuscript</label>
            {mss.length === 0 ? (
              <div className="text-sm text-inkmut">
                No ready manuscript — upload one from{" "}
                <Link href="/home" className="text-brand underline">
                  Home
                </Link>
                .
              </div>
            ) : (
              <>
                <select
                  value={msId}
                  onChange={(e) => setMsId(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"
                >
                  {mss.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title.slice(0, 90)}
                    </option>
                  ))}
                </select>
                <button onClick={create} disabled={creating} className="btn btn-primary self-start">
                  {creating ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                  Position this manuscript
                </button>
              </>
            )}
          </div>
        )}

        {mode === "collection" && (
          <div className="card p-4 mb-4 flex flex-col gap-2">
            <label className="section-title">
              Pick 2–30 saved papers ({selected.size} selected)
            </label>
            {library.length < 2 ? (
              <div className="text-sm text-inkmut">
                Your library needs at least 2 saved papers — save some from the{" "}
                <Link href="/literature" className="text-brand underline">
                  Literature Explorer
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto panel-scroll divide-y divide-line/60">
                  {library.map((p) => (
                    <label key={p.id} className="flex gap-2 py-1.5 text-[13px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                            return next;
                          })
                        }
                        className="accent-brand"
                      />
                      <span className="leading-snug line-clamp-1">
                        {p.title} {p.year ? `(${p.year})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={create}
                  disabled={selected.size < 2 || creating}
                  className="btn btn-primary self-start"
                >
                  {creating ? <Spinner className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                  Build map
                </button>
              </>
            )}
          </div>
        )}

        {error && <div className="card p-3 text-xs text-danger mb-4">{error}</div>}

        <h2 className="section-title mb-1 mt-6">Your saved maps</h2>
        {maps === null && <Spinner className="h-5 w-5 text-brand" />}
        <div className="flex flex-col divide-y divide-line/70">
          {(maps || []).map((m) => (
            <div
              key={m.id}
              className="py-1 flex items-center gap-1 hover:bg-surface2/50 -mx-2 px-2 rounded group"
            >
              <Link
                href={`/mind-maps/${m.id}`}
                className="flex-1 min-w-0 flex items-center gap-3 py-2"
              >
                <Network className="h-4 w-4 text-pub shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">{m.title}</div>
                  <div className="text-[11px] text-inkmut">
                    {m.seed_type} · {m.status}
                    {m.n_nodes != null ? ` · ${m.n_nodes} nodes` : ""}
                  </div>
                </div>
              </Link>
              <button
                onClick={async () => {
                  await api(`/mindmaps/${m.id}`, { method: "DELETE" });
                  loadMaps();
                }}
                className="btn btn-ghost p-1.5 opacity-0 group-hover:opacity-100 hover:text-danger"
                title="Delete this map"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {maps !== null && maps.length === 0 && (
            <div className="py-4 text-sm text-inkmut">
              No saved maps yet — build one from a seed above, then choose to save it.
            </div>
          )}
        </div>
      </div>
    </GlobalShell>
  );
}
