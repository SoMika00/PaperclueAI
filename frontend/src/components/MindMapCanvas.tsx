"use client";
/* Shared mind-map canvas. Center = seed (question / manuscript / collection).
   Edge COLOR = provenance (amber university / indigo public); edge STYLE =
   relation (solid cites / dashed similar topic). Nodes explain why they're here.
   Gap Finder spotlights uncited clusters. */
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  GitBranch,
  Lightbulb,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { MapEdge, MapGap, MapNode } from "@/lib/types";
import { ScopeBadge, Spinner } from "./ui";

const SCOPE_COLOR: Record<string, string> = {
  university: "#D68A19",
  public: "#3155C6",
  manuscript: "#15956A",
  derived: "#64748B",
};

function CenterNode({ data }: NodeProps) {
  const color = SCOPE_COLOR[data.source_scope] || "#2563EB";
  return (
    <div
      className="rounded-xl px-5 py-3 shadow-card max-w-[260px] text-center bg-paper"
      style={{ border: `2.5px solid ${color}` }}
    >
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
        {data.source_scope === "manuscript" ? "Your manuscript" : "Research seed"}
      </div>
      <div className="font-serif text-[13px] font-semibold leading-snug mt-1 text-ink">
        {data.label}
      </div>
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function PaperNode({ data }: NodeProps) {
  const color = SCOPE_COLOR[data.source_scope] || "#64748B";
  if (!data.showLabel) {
    // dot mode: provenance-colored dot, title on hover
    return (
      <div
        className={`cursor-pointer transition-opacity ${data.dimmed ? "opacity-25" : ""}`}
        title={`${data.label}${data.year ? ` (${data.year})` : ""}`}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <span
          className="block h-4 w-4 rounded-full border-[2.5px] bg-paper shadow-card hover:scale-125 transition-transform"
          style={{ borderColor: color }}
        />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg bg-paper px-3 py-2 shadow-card max-w-[200px] cursor-pointer hover:shadow-lg transition-all ${
        data.dimmed ? "opacity-25" : ""
      }`}
      style={{ border: `1.5px solid ${color}66`, borderLeft: `4px solid ${color}` }}
      title={data.why || data.meta?.tldr || ""}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-[11px] font-medium leading-snug line-clamp-3 text-ink">
        {data.label}
      </div>
      <div className="text-[9px] text-inkmut mt-1 flex items-center gap-1.5">
        {data.year && <span>{data.year}</span>}
        {data.meta?.citation_count != null && <span>{data.meta.citation_count} cit.</span>}
        {data.cluster && <span className="truncate italic">· {data.cluster}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

const nodeTypes = { center: CenterNode, paper: PaperNode };

function layout(
  nodes: MapNode[],
  rawEdges: MapEdge[],
  dimSet: Set<string> | null,
  showLabels: boolean,
  scopeOn: Record<string, boolean>,
  selectedId: string | null
): { nodes: Node[]; edges: Edge[] } {
  const visible = (n: MapNode) => scopeOn[n.source_scope] !== false;
  const papers = nodes.filter((n) => n.type !== "center" && visible(n));
  const clusters = Array.from(new Set(papers.map((p) => p.cluster || "Other")));
  const byCluster: Record<string, MapNode[]> = {};
  for (const p of papers) {
    const c = p.cluster || "Other";
    (byCluster[c] = byCluster[c] || []).push(p);
  }

  const center = nodes.find((n) => n.type === "center");
  const out: Node[] = center
    ? [{ id: center.id, type: "center", position: { x: 0, y: 0 }, data: center }]
    : [];

  let angleStart = -Math.PI / 2;
  for (const c of clusters) {
    const group = byCluster[c];
    const span = (2 * Math.PI * group.length) / Math.max(papers.length, 1);
    group.forEach((p, i) => {
      const angle = angleStart + (span * (i + 0.5)) / group.length;
      const radius = 350 + (i % 3) * 120;
      out.push({
        id: p.id,
        type: "paper",
        position: {
          x: Math.cos(angle) * radius * 1.3 - 100,
          y: Math.sin(angle) * radius - 30,
        },
        data: {
          ...p,
          dimmed: dimSet ? !dimSet.has(p.id) : false,
          showLabel: showLabels || p.id === selectedId,
        },
      });
    });
    angleStart += span;
  }

  const shown = new Set([...papers.map((p) => p.id), "center"]);
  const edges: Edge[] = rawEdges
    .filter((e) => shown.has(e.source) && shown.has(e.target))
    .map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "straight",
    style: {
      stroke: SCOPE_COLOR[e.source_scope] || "#64748B",
      strokeWidth: e.relation_type === "cites" ? 2.6 : 1.5,
      strokeDasharray: e.relation_type === "cites" ? undefined : "7 5",
      opacity: dimSet && !dimSet.has(e.target) ? 0.12 : 0.8,
    },
  }));

  return { nodes: out, edges };
}

const RELATION_LABEL: Record<string, string> = {
  cites: "Cited by your manuscript",
  similar_topic: "Similar topic",
  citation: "Cited by your manuscript",
  thematic: "Similar topic",
};

export default function MindMapCanvas({
  mapId,
  graph,
  onGraphChange,
}: {
  mapId: string;
  graph: { nodes: MapNode[]; edges: MapEdge[]; gaps: MapGap[] };
  onGraphChange?: (g: { nodes: MapNode[]; edges: MapEdge[]; gaps: MapGap[] }) => void;
}) {
  const [selected, setSelected] = useState<MapNode | null>(null);
  const [spotlight, setSpotlight] = useState<Set<string> | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [scopeOn, setScopeOn] = useState<Record<string, boolean>>({
    public: true,
    university: true,
    manuscript: true,
  });

  const flow = useMemo(
    () =>
      layout(graph.nodes, graph.edges, spotlight, showLabels, scopeOn,
             selected?.id || null),
    [graph, spotlight, showLabels, scopeOn, selected]
  );

  const stats = useMemo(() => {
    const papers = graph.nodes.filter((n) => n.type !== "center");
    const families = new Set(papers.map((p) => p.cluster).filter(Boolean));
    const cited = graph.edges.filter(
      (e) => e.relation_type === "cites" || e.relation_type === "citation"
    ).length;
    return { papers: papers.length, families: families.size, cited,
             gaps: graph.gaps?.length || 0 };
  }, [graph]);

  const relationFor = useCallback(
    (nodeId: string) => {
      const e = graph.edges.find((e) => e.target === nodeId);
      return e ? RELATION_LABEL[e.relation_type] || e.relation_type : "";
    },
    [graph.edges]
  );

  const expand = useCallback(async () => {
    if (!selected || expanding) return;
    setExpanding(true);
    setNotice(null);
    try {
      const res = await api<{ added: number; graph: any }>(`/mindmaps/${mapId}/expand`, {
        method: "POST",
        body: JSON.stringify({ node_id: selected.id }),
      });
      onGraphChange?.({ gaps: graph.gaps, ...res.graph });
      setNotice(res.added ? `${res.added} related papers added.` : "No new neighbors found.");
    } catch (e: any) {
      setNotice(e.message?.slice(0, 140) || "Expansion failed");
    } finally {
      setExpanding(false);
    }
  }, [selected, expanding, mapId, graph.gaps, onGraphChange]);

  const save = useCallback(async (n: MapNode) => {
    try {
      await api("/library", {
        method: "POST",
        body: JSON.stringify({
          corpus_id: n.id,
          title: n.label,
          authors: n.meta?.authors || [],
          year: n.year,
          venue: n.meta?.venue || "",
          abstract: n.meta?.tldr || "",
          url: n.meta?.url,
          source_scope: n.source_scope,
        }),
      });
      setSaved((s) => new Set(s).add(n.id));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) =>
          node.type === "paper" && setSelected(node.data as MapNode)
        }
        onPaneClick={() => {
          setSelected(null);
          setSpotlight(null);
        }}
        nodesDraggable
        nodesConnectable={false}
      >
        <Background color="#0F172A" gap={28} size={0.7} style={{ opacity: 0.25 }} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute top-4 left-4 card px-3 py-2.5 text-[11px] flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-6 rounded" style={{ background: "#D68A19" }} />
          University corpus
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-6 rounded" style={{ background: "#3155C6" }} />
          Public literature
        </div>
        <div className="flex items-center gap-1.5 text-inkmut">
          <span className="inline-block w-6 border-t-2 border-ink/50" /> cites
          <span className="inline-block w-6 border-t-2 border-dashed border-ink/50 ml-1" />
          similar
        </div>
      </div>

      {/* Control bar: labels + provenance filters, and the map summary */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5">
        <div className="card px-2 py-1.5 flex items-center gap-1 text-[11px] font-medium">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-md px-2 py-1 transition-colors ${
              showLabels ? "bg-brand text-white" : "text-inkmut hover:bg-surface2"
            }`}
          >
            Labels {showLabels ? "✓" : "○"}
          </button>
          <span className="w-px h-4 bg-line mx-0.5" />
          {(
            [
              ["public", "Public", "#3155C6"],
              ["university", "University", "#D68A19"],
              ["manuscript", "Manuscript", "#15956A"],
            ] as const
          ).map(([k, label, color]) => (
            <button
              key={k}
              onClick={() => setScopeOn((sc) => ({ ...sc, [k]: !sc[k] }))}
              className={`rounded-md px-2 py-1 inline-flex items-center gap-1.5 transition-colors ${
                scopeOn[k] ? "text-ink" : "text-inkmut/50 line-through"
              } hover:bg-surface2`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: color, opacity: scopeOn[k] ? 1 : 0.3 }}
              />
              {label}
            </button>
          ))}
        </div>
        <div className="rounded-full bg-ink/80 text-white px-3 py-1 text-[11px]">
          {stats.papers} papers · {stats.families} research families ·{" "}
          {stats.cited} cited{stats.gaps > 0 ? ` · ${stats.gaps} potential gap${stats.gaps > 1 ? "s" : ""}` : ""}
        </div>
      </div>

      {/* Gap Finder */}
      {graph.gaps?.length > 0 && (
        <div className="absolute bottom-4 left-4 card p-3.5 max-w-sm bg-uni-soft border-uni/50 z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-uni">
            <Lightbulb className="h-4 w-4" /> Potential literature gap
          </div>
          {graph.gaps.map((g) => (
            <div key={g.cluster} className="mt-2">
              <p className="text-xs text-ink leading-snug">{g.message}</p>
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() =>
                    setSpotlight((s) =>
                      s && g.paper_ids.every((id) => s.has(id))
                        ? null
                        : new Set(g.paper_ids)
                    )
                  }
                  className="btn btn-outline text-[11px] py-0.5 px-2 bg-paper"
                >
                  Inspect cluster
                </button>
                <button
                  onClick={async () => {
                    for (const id of g.paper_ids.slice(0, 5)) {
                      const n = graph.nodes.find((x) => x.id === id);
                      if (n) await save(n);
                    }
                    setNotice(`${Math.min(g.count, 5)} papers saved to your library ("Saved papers").`);
                  }}
                  className="btn btn-outline text-[11px] py-0.5 px-2 bg-paper"
                >
                  Add references
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 card px-3 py-2 text-xs z-20">
          {notice}
          <button onClick={() => setNotice(null)} className="ml-2 text-inkmut">
            ✕
          </button>
        </div>
      )}

      {/* Node detail */}
      {selected && (
        <div className="absolute bottom-4 right-4 card p-4 w-[22rem] z-10">
          <div className="flex items-start justify-between gap-2">
            <ScopeBadge scope={selected.source_scope} />
            <button onClick={() => setSelected(null)} className="text-inkmut hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="font-medium text-[13px] leading-snug mt-2 text-ink">
            {selected.label}
          </div>
          <div className="text-[11px] text-inkmut mt-1">
            {(selected.meta?.authors || []).join(", ")}
            {selected.year ? ` · ${selected.year}` : ""}
            {selected.meta?.venue ? ` · ${selected.meta.venue}` : ""}
            {selected.meta?.citation_count != null
              ? ` · ${selected.meta.citation_count} citations`
              : ""}
          </div>
          {selected.why && (
            <div className="mt-2 rounded-lg bg-brand-soft/60 border border-brand/30 px-2.5 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                Why this paper is here
              </div>
              <p className="text-[11px] text-ink leading-snug mt-0.5">{selected.why}</p>
            </div>
          )}
          <div className="text-[11px] text-inkmut mt-1.5">{relationFor(selected.id)}</div>
          {selected.meta?.tldr && (
            <p className="text-[11px] text-inkmut leading-snug mt-1.5 max-h-24 overflow-y-auto panel-scroll">
              {selected.meta.tldr}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selected.meta?.url && (
              <a
                href={selected.meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-[11px] py-1 px-2"
              >
                <ExternalLink className="h-3 w-3" /> Open paper
              </a>
            )}
            <button
              onClick={() => save(selected)}
              disabled={saved.has(selected.id)}
              className="btn btn-outline text-[11px] py-1 px-2"
            >
              {saved.has(selected.id) ? (
                <>
                  <BookmarkCheck className="h-3 w-3 text-manuscript" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3 w-3" /> Add to my research
                </>
              )}
            </button>
            <button
              onClick={expand}
              disabled={expanding}
              className="btn btn-outline text-[11px] py-1 px-2"
            >
              {expanding ? <Spinner className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
              Expand branch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
