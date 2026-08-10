"use client";
/* Subscription entitlement — fetches /billing/status once per session and
   exposes it app-wide. `active` (Stripe status active|trialing) gates premium
   features via <PremiumGate>. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Entitlement = {
  active: boolean;
  status: string;
  plan: string | null;
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<Entitlement>({
  active: false,
  status: "none",
  plan: null,
  loading: true,
  refresh: () => {},
});

export const usePremium = () => useContext(Ctx);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<{ active: boolean; status: string; plan: string | null }>({
    active: false,
    status: "none",
    plan: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setState({ active: false, status: "none", plan: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await api<{ active: boolean; status: string; plan: string | null }>("/billing/status");
      setState({ active: !!s.active, status: s.status, plan: s.plan });
    } catch {
      // billing not configured / network → treat as no entitlement
      setState({ active: false, status: "none", plan: null });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ ...state, loading, refresh }}>{children}</Ctx.Provider>;
}
