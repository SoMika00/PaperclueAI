"use client";
import { Logo } from "@/components/Logo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";
import { useLocale } from "./i18n";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

export interface Profile {
  full_name: string | null;
  role: string;
  institution_name: string | null;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  ready: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  session: null,
  profile: null,
  ready: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role, institutions(name)")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const inst = (data as any).institutions;
  return {
    full_name: data.full_name,
    role: data.role,
    institution_name: inst?.name ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) setProfile(await loadProfile(data.session.user.id));
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id).then(setProfile);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <Ctx.Provider value={{ session, profile, ready, signOut }}>{children}</Ctx.Provider>
  );
}

export function SignInGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const { t, locale, toggle: toggleLocale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const KNOWN_PREFIXES = [
    "/home", "/discover", "/library", "/literature", "/mind-maps",
    "/university", "/admin", "/manuscripts", "/ms", "/settings",
  ];
  const isKnownRoute = KNOWN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isPublicRoute = pathname === "/" || pathname === "/login";

  if (!isPublicRoute && !isKnownRoute && ready) {
    return <>{children}</>; // let Next.js render its not-found boundary
  }

  if (!ready) return null;
  if (session && pathname === "/login") {
    router.replace("/home");
    return null;
  }
  if (session || (isPublicRoute && pathname !== "/login")) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/home");
  };

  return (
    <div className="h-screen grid place-items-center bg-ivory dark:bg-dark-bg px-6 transition-colors">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm text-center shadow-drawer relative">
        <button
          type="button"
          onClick={toggleLocale}
          className="absolute top-3 right-3 text-xs font-semibold text-inkmut dark:text-dark-inkmut hover:text-ink dark:hover:text-dark-ink"
        >
          {locale === "en" ? "日本語" : "English"}
        </button>
        <Logo className="mx-auto block h-9" />
        <h1 className="font-serif text-xl font-semibold mt-3">{t("signin_title")}</h1>
        <p className="text-sm text-inkmut dark:text-dark-inkmut mt-1 mb-5">
          {t("signin_subtitle")}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("signin_email_placeholder")}
          className="w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-3 py-2 text-sm mb-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("signin_password_placeholder")}
          className="w-full rounded-lg border border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 dark:text-dark-ink px-3 py-2 text-sm mb-3"
          required
        />
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? t("signin_loading") : t("signin_button")}
        </button>
      </form>
    </div>
  );
}
