"use client";
/* Manuscript workspace context. The active feature is the route segment;
   this holds the cross-feature state: PDF highlight requests, the evidence
   ledger, and the evidence drawer (closed by default). */
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";
import type { EvidenceItem, Manuscript } from "./types";

export interface HighlightReq {
  page: number;
  quote: string;
  kind: "insight" | "review" | "citation";
  nonce: number;
}

interface WorkspaceState {
  ms: Manuscript;
  refreshMs: () => Promise<void>;
  highlight: HighlightReq | null;
  requestHighlight: (
    page: number | null | undefined,
    quote: string | null | undefined,
    kind?: HighlightReq["kind"]
  ) => void;
  evidence: EvidenceItem[];
  refreshEvidence: () => Promise<void>;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  readinessDelta: number | null;
}

const Ctx = createContext<WorkspaceState | null>(null);

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace outside provider");
  return ctx;
}

// Routes whose canvas is the PDF; highlights can only land there.
const PDF_SEGMENTS = ["chat", "insight", "review", "journal"];

export function WorkspaceProvider({
  initial,
  children,
}: {
  initial: Manuscript;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ms, setMs] = useState<Manuscript>(initial);
  const [highlight, setHighlight] = useState<HighlightReq | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [readinessDelta, setDelta] = useState<number | null>(null);

  const refreshMs = useCallback(async () => {
    const fresh = await api<Manuscript>(`/manuscripts/${initial.id}`);
    setMs((prev) => {
      if (fresh.readiness !== prev.readiness) {
        setDelta(fresh.readiness - prev.readiness);
        setTimeout(() => setDelta(null), 2600);
      }
      return fresh;
    });
  }, [initial.id]);

  const refreshEvidence = useCallback(async () => {
    try {
      setEvidence(await api<EvidenceItem[]>(`/manuscripts/${initial.id}/evidence`));
    } catch {
      /* drawer stays as-is */
    }
  }, [initial.id]);

  useEffect(() => {
    refreshEvidence();
  }, [refreshEvidence]);

  const requestHighlight = useCallback(
    (
      page: number | null | undefined,
      quote: string | null | undefined,
      kind: HighlightReq["kind"] = "insight"
    ) => {
      if (!quote) return;
      const seg = pathname.split("/").pop() || "";
      if (!PDF_SEGMENTS.includes(seg)) {
        router.push(`/manuscripts/${initial.id}/insight`);
      }
      setHighlight({ page: page || 1, quote, kind, nonce: Date.now() });
    },
    [pathname, router, initial.id]
  );

  return (
    <Ctx.Provider
      value={{
        ms,
        refreshMs,
        highlight,
        requestHighlight,
        evidence,
        refreshEvidence,
        drawerOpen,
        setDrawerOpen,
        readinessDelta,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
