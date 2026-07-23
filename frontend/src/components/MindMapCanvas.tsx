"use client";
/* Shared mind-map canvas. Center = seed (question / manuscript / collection).
   Edge COLOR = provenance (amber university / blue public); edge STYLE =
   relation (solid cites / dashed similar topic). Nodes explain why they're here.

   Reads as a MAP, not a list: papers are packed into visible cluster regions
   ("research families") with headings, node size encodes citation influence,
   and the map is searchable and filterable by year. Gap Finder spotlights
   uncited clusters. */
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
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
  FileText,
  GitBranch,
  Lightbulb,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import type { MapEdge, MapGap, MapNode } from "@/lib/types";
import PaperQuickActions, { FocusDestination } from "./PaperQuickActions";
import { ScopeBadge, Spinner } from "./ui";

const SCOPE_COLOR: Record<string, string> = {
  university: "#E0951A",
  public: "#3D7DFF",
  manuscript: "#0F9B8E",
  derived: "#8A8A94",
};

/* Citation influence → tier → visual weight. Pivotal papers are bigger and
   always labelled so the field's landmarks pop at a glance. */
type Tier = "pivotal" | "notable" | "standard";
function citationTier(n: MapNode): Tier {
  const c = n.meta?.citation_count ?? 0;
  if (c >= 500) return "pivotal";
  if (c >= 50) return "notable";
  return "standard";
}
const TIER_DOT: Record<Tier, number> = { pivotal: 13, notable: 9, standard: 6.5 };
const TIER_CELL: Record<Tier, { w: number; h: number }> = {
  pivotal: { w: 250, h: 96 },
  notable: { w: 220, h: 82 },
  standard: { w: 196, h: 74 },
};

function CenterNode({ data }: NodeProps) {
  const { t } = useLocale();
  const color = SCOPE_COLOR[data.source_scope] || "#FF8A3D";
  return (
    <div
      className="rounded-xl px-5 py-3 shadow-card max-w-[260px] text-center bg-paper"
      style={{ border: `2.5px solid ${color}` }}
    >
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
        {data.source_scope === "manuscript" ? t("your_manuscript_node") : t("research_seed_node")}
      </div>
      <div className="font-serif text-[13px] font-semibold leading-snug mt-1 text-ink">
        {data.label}
      </div>
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

/* Non-interactive background region behind a research family. */
function ClusterNode({ data }: NodeProps) {
  return (
    <div
      className="pointer-events-none rounded-3xl"
      style={{
        width: data.w,
        height: data.h,
        background: `${data.color}12`,
        border: `1.5px dashed ${data.color}55`,
      }}
    >
      <div
        className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
        style={{ background: data.color, color: "#fff" }}
      >
        {data.label}
      </div>
    </div>
  );
}

function PaperNode({ data }: NodeProps) {
  const color = SCOPE_COLOR[data.source_scope] || "#8A8A94";
  const tier: Tier = data.tier || "standard";
  if (!data.showLabel) {
    const r = TIER_DOT[tier];
    return (
      <div
        className={`cursor-pointer transition-opacity ${data.dimmed ? "opacity-20" : ""}`}
        title={`${data.label}${data.year ? ` (${data.year})` : ""}`}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <span
          className="block rounded-full border-[2.5px] bg-paper shadow-card hover:scale-125 transition-transform"
          style={{ borderColor: color, width: r * 2, height: r * 2 }}
        />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>
    );
  }
  const isPivotal = tier === "pivotal";
  return (
    <div
      className={`rounded-lg bg-paper px-3 py-2 shadow-card cursor-pointer hover:shadow-lg transition-all ${
        data.dimmed ? "opacity-20" : ""
      }`}
      style={{
        maxWidth: TIER_CELL[tier].w - 40,
        border: `1.5px solid ${color}66`,
        borderLeft: `${isPivotal ? 6 : 4}px solid ${color}`,
      }}
      title={data.why || data.meta?.tldr || ""}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div
        className={`font-medium leading-snug line-clamp-3 text-ink ${isPivotal ? "text-[12px]" : "text-[11px]"}`}
      >
        {data.label}
      </div>
      <div className="text-[9px] text-inkmut mt-1 flex items-center gap-1.5 flex-wrap">
        {data.year && <span>{data.year}</span>}
        {data.meta?.citation_count != null && (
          <span
            className={isPivotal ? "font-semibold" : ""}
            style={isPivotal ? { color } : undefined}
          >
            {data.meta.citation_count.toLocaleString()} cit.
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

const nodeTypes = { center: CenterNode, paper: PaperNode, cluster: ClusterNode };

type Region = { cluster: string; x: number; y: number; w: number; h: number; color: string };

function layout(
  nodes: MapNode[],
  rawEdges: MapEdge[],
  dimSet: Set<string> | null,
  showLabels: boolean,
  scopeOn: Record<string, boolean>,
  selectedId: string | null,
  positions: Record<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  const visible = (n: MapNode) => scopeOn[n.source_scope] !== false;
  const papers = nodes.filter((n) => n.type !== "center" && visible(n));

  // Group into clusters, ordered by size (biggest family first).
  const byCluster: Record<string, MapNode[]> = {};
  for (const p of papers) {
    const c = p.cluster || "—";
    (byCluster[c] = byCluster[c] || []).push(p);
  }
  const clusters = Object.entries(byCluster).sort((a, b) => b[1].length - a[1].length);

  // Each cluster is packed into a small grid; cluster blobs are placed on a
  // ring big enough that neighbouring families don't collide.
  const clusterGrids = clusters.map(([name, group]) => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(group.length)));
    const rows = Math.ceil(group.length / cols);
    const cell = TIER_CELL.notable; // uniform cell for packing math
    return { name, group, cols, rows, w: cols * cell.w, h: rows * cell.h };
  });
  const totalW = clusterGrids.reduce((s, g) => s + g.w + 140, 0);
  const ring = Math.max(520, totalW / (2 * Math.PI));

  const center = nodes.find((n) => n.type === "center");
  const out: Node[] = [];
  const regions: Region[] = [];

  let cursorAngle = -Math.PI / 2;
  for (const g of clusterGrids) {
    const frac = (g.w + 140) / totalW;
    const angle = cursorAngle + frac * Math.PI; // sector midpoint
    cursorAngle += frac * 2 * Math.PI;
    const cx = Math.cos(angle) * ring;
    const cy = Math.sin(angle) * ring;
    const cell = TIER_CELL.notable;
    const originX = cx - g.w / 2;
    const originY = cy - g.h / 2;

    g.group.forEach((p, i) => {
      const col = i % g.cols;
      const row = Math.floor(i / g.cols);
      const computed = {
        x: originX + col * cell.w + cell.w / 2 - 90,
        y: originY + row * cell.h,
      };
      const pos = positions[p.id] || p.position || computed;
      out.push({
        id: p.id,
        type: "paper",
        position: pos,
        zIndex: 2,
        data: {
          ...p,
          tier: citationTier(p),
          dimmed: dimSet ? !dimSet.has(p.id) : false,
          showLabel: showLabels || p.id === selectedId || citationTier(p) === "pivotal",
        },
      });
    });

    // Region box bounds the members' actual rendered positions.
    const xs = g.group.map((p) => (positions[p.id] || p.position || { x: originX }).x);
    const ys = g.group.map((p) => (positions[p.id] || p.position || { y: originY }).y);
    const minX = Math.min(...xs, originX) - 24;
    const minY = Math.min(...ys, originY) - 28;
    const maxX = Math.max(...xs.map((x, i) => x), originX + g.w) + 190;
    const maxY = Math.max(...ys, originY + g.h) + 60;
    if (g.name !== "—") {
      regions.push({
        cluster: g.name,
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        color: SCOPE_COLOR[g.group[0].source_scope] || "#8A8A94",
      });
    }
  }

  // Cluster regions first, behind everything.
  const regionNodes: Node[] = regions.map((r) => ({
    id: `region-${r.cluster}`,
    type: "cluster",
    position: { x: r.x, y: r.y },
    data: { label: r.cluster, w: r.w, h: r.h, color: r.color },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: 0,
  }));

  const centerNode: Node[] = center
    ? [{
        id: center.id,
        type: "center",
        position: positions[center.id] || center.position || { x: 0, y: 0 },
        zIndex: 3,
        data: center,
      }]
    : [];

  const shown = new Set([...papers.map((p) => p.id), "center", center?.id].filter(Boolean) as string[]);
  const edges: Edge[] = rawEdges
    .filter((e) => shown.has(e.source) && shown.has(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "straight",
      style: {
        stroke: SCOPE_COLOR[e.source_scope] || "#8A8A94",
        strokeWidth: e.relation_type === "cites" ? 2.6 : 1.5,
        strokeDasharray: e.relation_type === "cites" ? undefined : "7 5",
        opacity: dimSet && !dimSet.has(e.target) ? 0.08 : 0.75,
      },
    }));

  return { nodes: [...regionNodes, ...centerNode, ...out], edges };
}

const RELATION_LABEL_KEY: Record<string, string> = {
  cites: "edge_cited_manuscript",
  similar_topic: "edge_similar_topic",
  citation: "edge_cited_manuscript",
  thematic: "edge_similar_topic",
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
  const { t } = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<MapNode | null>(null);
  const [spotlight, setSpotlight] = useState<Set<string> | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(graph.nodes.filter((node) => node.position).map((node) => [node.id, node.position!]))
  );
  const [showLabels, setShowLabels] = useState(true);
  const [scopeOn, setScopeOn] = useState<Record<string, boolean>>({
    public: true,
    university: true,
    manuscript: true,
  });

  // Year range across the papers (drives the year filter).
  const years = useMemo(
    () => graph.nodes.map((n) => n.year).filter((y): y is number => typeof y === "number"),
    [graph.nodes]
  );
  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 0;
  const [fromYear, setFromYear] = useState(minYear);
  const [toYear, setToYear] = useState(maxYear);
  const yearActive = years.length > 1 && (fromYear > minYear || toYear < maxYear);

  // Filter set: nodes passing the active search + year filters. null = no
  // filter (nothing dimmed). Spotlight (gap finder) intersects with it.
  const filterSet = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !yearActive) return null;
    const ids = new Set<string>();
    for (const n of graph.nodes) {
      if (n.type === "center") continue;
      const matchesSearch =
        !q ||
        n.label.toLowerCase().includes(q) ||
        (n.meta?.venue || "").toLowerCase().includes(q) ||
        (n.meta?.authors || []).join(" ").toLowerCase().includes(q);
      const matchesYear = !yearActive || !n.year || (n.year >= fromYear && n.year <= toYear);
      if (matchesSearch && matchesYear) ids.add(n.id);
    }
    return ids;
  }, [search, yearActive, fromYear, toYear, graph.nodes]);

  const dimSet = useMemo(() => {
    if (spotlight && filterSet) return new Set([...spotlight].filter((id) => filterSet.has(id)));
    return spotlight || filterSet;
  }, [spotlight, filterSet]);

  const flow = useMemo(
    () => layout(graph.nodes, graph.edges, dimSet, showLabels, scopeOn, selected?.id || null, positions),
    [graph, dimSet, showLabels, scopeOn, selected, positions]
  );

  const stats = useMemo(() => {
    const papers = graph.nodes.filter((n) => n.type !== "center");
    const families = new Set(papers.map((p) => p.cluster).filter(Boolean));
    const cited = graph.edges.filter(
      (e) => e.relation_type === "cites" || e.relation_type === "citation"
    ).length;
    return { papers: papers.length, families: families.size, cited, gaps: graph.gaps?.length || 0 };
  }, [graph]);

  const relationFor = useCallback(
    (nodeId: string) => {
      const e = graph.edges.find((e) => e.target === nodeId);
      const key = e ? RELATION_LABEL_KEY[e.relation_type] : null;
      return key ? t(key as any) : e ? e.relation_type : "";
    },
    [graph.edges, t]
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
      setNotice(res.added ? `${res.added} ${t("map_papers_added")}` : t("map_no_neighbors"));
    } catch (e: any) {
      setNotice(e.message?.slice(0, 140) || t("expansion_failed"));
    } finally {
      setExpanding(false);
    }
  }, [selected, expanding, mapId, graph.gaps, onGraphChange, t]);

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

  const openInFocus = useCallback(
    async (n: MapNode, destination: string) => {
      if (opening) return;
      setOpening(destination);
      setNotice(null);
      try {
        // A university node carries the row id (kind:university → id); a public
        // node is a Semantic Scholar paper, so the backend's public import wants
        // its corpus_id (the node id IS the corpus_id) + a title.
        const body =
          n.source_scope === "university"
            ? { kind: "university", id: n.id }
            : { kind: "public", corpus_id: n.id, title: n.label };
        const result = await api<{ manuscript_id: string }>("/import", {
          method: "POST",
          body: JSON.stringify(body),
        });
        router.push(`/manuscripts/${result.manuscript_id}/${destination}`);
      } catch (error: any) {
        setNotice(
          error.message?.includes("open-access")
            ? t("map_no_oa_focus")
            : error.message?.slice(0, 140) || t("map_cannot_open")
        );
        setOpening(null);
      }
    },
    [opening, router, t]
  );

  const moveNode = useCallback((node: Node) => {
    setPositions((current) => ({ ...current, [node.id]: node.position }));
  }, []);

  const saveNodePosition = useCallback(
    async (node: Node) => {
      moveNode(node);
      try {
        await api(`/mindmaps/${mapId}`, {
          method: "PATCH",
          body: JSON.stringify({ positions: { [node.id]: node.position } }),
        });
      } catch (error: any) {
        setNotice(error.message?.slice(0, 120) || t("map_cannot_save_pos"));
      }
    },
    [mapId, moveNode, t]
  );

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => node.type === "paper" && setSelected(node.data as MapNode)}
        onPaneClick={() => {
          setSelected(null);
          setSpotlight(null);
        }}
        nodesDraggable
        nodesConnectable={false}
        onNodeDrag={(_, node) => node.type === "paper" && moveNode(node)}
        onNodeDragStop={(_, node) => node.type === "paper" && saveNodePosition(node)}
      >
        <Background color="#14213D" gap={28} size={0.7} style={{ opacity: 0.18 }} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(n) =>
            n.type === "cluster"
              ? "transparent"
              : SCOPE_COLOR[(n.data as any)?.source_scope] || "#8A8A94"
          }
          maskColor="rgba(20,33,61,0.08)"
          className="!bg-paper !border !border-line dark:!bg-dark-surface dark:!border-dark-line"
          style={{ width: 150, height: 100 }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute top-4 left-4 card px-3 py-2.5 text-[11px] flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-6 rounded" style={{ background: "#E0951A" }} />
          {t("map_legend_uni")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-6 rounded" style={{ background: "#3D7DFF" }} />
          {t("heromap_legend_public")}
        </div>
        <div className="flex items-center gap-1.5 text-inkmut">
          <span className="inline-block w-6 border-t-2 border-ink/50" /> {t("map_legend_cites")}
          <span className="inline-block w-6 border-t-2 border-dashed border-ink/50 ml-1" />
          {t("map_legend_similar")}
        </div>
        <div className="flex items-center gap-1.5 text-inkmut border-t border-line pt-1.5 mt-0.5 dark:border-dark-line">
          <span className="inline-flex items-end gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-inkmut" />
            <span className="h-2.5 w-2.5 rounded-full bg-inkmut" />
          </span>
          {t("map_legend_size")}
        </div>
      </div>

      {/* Control bar: search, labels, provenance filters, year, summary */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 w-[min(92%,640px)]">
        <div className="card px-2 py-1.5 flex items-center gap-1 text-[11px] font-medium flex-wrap justify-center">
          {/* Search */}
          <div className="flex items-center gap-1 rounded-md bg-surface2 dark:bg-dark-surface2 px-2 py-1">
            <Search className="h-3 w-3 text-inkmut" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("map_search_placeholder")}
              className="bg-transparent outline-none text-[11px] w-36 text-ink dark:text-dark-ink placeholder:text-inkmut/60"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-inkmut hover:text-ink">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="w-px h-4 bg-line mx-0.5" />
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-md px-2 py-1 transition-colors ${
              showLabels ? "bg-brand text-ink" : "text-inkmut hover:bg-surface2"
            }`}
          >
            {t("map_labels")} {showLabels ? "✓" : "○"}
          </button>
          <span className="w-px h-4 bg-line mx-0.5" />
          {(
            [
              ["public", t("scope_public"), "#3D7DFF"],
              ["university", t("scope_university"), "#E0951A"],
              ["manuscript", t("scope_manuscript"), "#0F9B8E"],
            ] as const
          ).map(([k, label, color]) => (
            <button
              key={k}
              onClick={() => setScopeOn((sc) => ({ ...sc, [k]: !sc[k] }))}
              className={`rounded-md px-2 py-1 inline-flex items-center gap-1.5 transition-colors ${
                scopeOn[k] ? "text-ink dark:text-dark-ink" : "text-inkmut/50 line-through"
              } hover:bg-surface2`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: color, opacity: scopeOn[k] ? 1 : 0.3 }} />
              {label}
            </button>
          ))}
        </div>

        {/* Year range */}
        {years.length > 1 && (
          <div className="card px-3 py-1.5 flex items-center gap-2 text-[11px]">
            <span className="text-inkmut">{t("map_years")}</span>
            <span className="font-semibold text-ink dark:text-dark-ink w-9 text-right">{fromYear}</span>
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={fromYear}
              onChange={(e) => setFromYear(Math.min(Number(e.target.value), toYear))}
              className="accent-brand w-24"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={toYear}
              onChange={(e) => setToYear(Math.max(Number(e.target.value), fromYear))}
              className="accent-brand w-24"
            />
            <span className="font-semibold text-ink dark:text-dark-ink w-9">{toYear}</span>
            {yearActive && (
              <button
                onClick={() => {
                  setFromYear(minYear);
                  setToYear(maxYear);
                }}
                className="text-inkmut hover:text-ink"
                title={t("map_year_reset")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="rounded-full bg-ink/80 text-white px-3 py-1 text-[11px]">
          {stats.papers} {t("stats_papers")} · {stats.families} {t("stats_research_families")} ·{" "}
          {stats.cited} {t("stats_cited")}
          {stats.gaps > 0
            ? ` · ${stats.gaps} ${stats.gaps > 1 ? t("stats_potential_gaps") : t("stats_potential_gap")}`
            : ""}
        </div>
      </div>

      {/* Gap Finder */}
      {graph.gaps?.length > 0 && (
        <div className="absolute bottom-4 left-4 card p-3.5 max-w-sm bg-uni-soft dark:bg-dark-surface2 border-uni/50 dark:border-dark-line z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-uni dark:text-warn">
            <Lightbulb className="h-4 w-4" /> {t("potential_gap_title")}
          </div>
          {graph.gaps.map((g) => (
            <div key={g.cluster} className="mt-2">
              <p className="text-xs text-ink dark:text-dark-ink leading-snug">{g.message}</p>
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() =>
                    setSpotlight((s) =>
                      s && g.paper_ids.every((id) => s.has(id)) ? null : new Set(g.paper_ids)
                    )
                  }
                  className="btn btn-outline text-[11px] py-0.5 px-2 bg-paper dark:bg-dark-surface dark:text-dark-ink dark:border-dark-line"
                >
                  {t("inspect_cluster")}
                </button>
                <button
                  onClick={async () => {
                    for (const id of g.paper_ids.slice(0, 5)) {
                      const n = graph.nodes.find((x) => x.id === id);
                      if (n) await save(n);
                    }
                    setNotice(`${Math.min(g.count, 5)} ${t("papers_saved_notice")}`);
                  }}
                  className="btn btn-outline text-[11px] py-0.5 px-2 bg-paper dark:bg-dark-surface dark:text-dark-ink dark:border-dark-line"
                >
                  {t("add_references")}
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
          <div className="font-medium text-[13px] leading-snug mt-2 text-ink">{selected.label}</div>
          <div className="text-[11px] text-inkmut mt-1">
            {(selected.meta?.authors || []).join(", ")}
            {selected.year ? ` · ${selected.year}` : ""}
            {selected.meta?.venue ? ` · ${selected.meta.venue}` : ""}
            {selected.meta?.citation_count != null ? ` · ${selected.meta.citation_count} citations` : ""}
          </div>
          {selected.why && (
            <div className="mt-2 rounded-lg bg-brand-soft/60 border border-brand/30 px-2.5 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                {t("map_why_here")}
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
            <button
              onClick={() => openInFocus(selected, "overview")}
              disabled={!!opening}
              className="btn btn-primary text-[11px] py-1 px-2"
            >
              {opening === "overview" ? <Spinner className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              {t("open_in_focus")}
            </button>
            <button
              onClick={() => openInFocus(selected, "chat")}
              disabled={!!opening}
              className="btn btn-outline text-[11px] py-1 px-2"
            >
              {opening === "chat" ? <Spinner className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {t("chat_label")}
            </button>
            {selected.meta?.url && (
              <a
                href={selected.meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-[11px] py-1 px-2"
              >
                <ExternalLink className="h-3 w-3" /> {t("map_open_paper")}
              </a>
            )}
            <button
              onClick={() => save(selected)}
              disabled={saved.has(selected.id)}
              className="btn btn-outline text-[11px] py-1 px-2"
            >
              {saved.has(selected.id) ? (
                <>
                  <BookmarkCheck className="h-3 w-3 text-manuscript" /> {t("saved_button")}
                </>
              ) : (
                <>
                  <Bookmark className="h-3 w-3" /> {t("add_to_research")}
                </>
              )}
            </button>
            <button onClick={expand} disabled={expanding} className="btn btn-outline text-[11px] py-1 px-2">
              {expanding ? <Spinner className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
              {t("map_expand_branch")}
            </button>
          </div>
          <PaperQuickActions
            compact
            onOpen={(destination: FocusDestination) => openInFocus(selected, destination)}
            disabled={!!opening}
            active={opening}
          />
        </div>
      )}
    </div>
  );
}
