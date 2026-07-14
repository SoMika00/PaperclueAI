"use client";
/* Template auth: always auto-connected to the demo user; sign out / sign in
   just toggles the client session so the flow exists for the demo. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface DemoUser {
  name: string;
  email: string;
  tenant: string;
  initials: string;
}

const TEST_USER: DemoUser = {
  name: "Dr. Test Researcher",
  email: "researcher@demo-university.edu",
  tenant: "Demo University",
  initials: "TR",
};

interface AuthState {
  user: DemoUser | null;
  ready: boolean;
  signIn: () => void;
  signOut: () => void;
}

const Ctx = createContext<AuthState>({
  user: null,
  ready: false,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auto-connect by default; only an explicit sign-out persists.
    const out = localStorage.getItem("pc_signed_out") === "1";
    setUser(out ? null : TEST_USER);
    setReady(true);
  }, []);

  const signIn = useCallback(() => {
    localStorage.removeItem("pc_signed_out");
    setUser(TEST_USER);
  }, []);

  const signOut = useCallback(() => {
    localStorage.setItem("pc_signed_out", "1");
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, ready, signIn, signOut }}>{children}</Ctx.Provider>
  );
}

export function SignInGate({ children }: { children: React.ReactNode }) {
  const { user, ready, signIn } = useAuth();
  if (!ready) return null;
  if (user) return <>{children}</>;
  return (
    <div className="h-screen grid place-items-center bg-ivory px-6">
      <div className="card p-8 w-full max-w-sm text-center shadow-drawer">
        <span className="mx-auto h-11 w-11 rounded-xl bg-topbar text-white grid place-items-center font-serif font-bold text-lg">
          P
        </span>
        <h1 className="font-serif text-xl font-semibold mt-3">Sign in to PaperClue</h1>
        <p className="text-sm text-inkmut mt-1 mb-5">
          Grounded research workspace for your institution.
        </p>
        <input
          value="researcher@demo-university.edu"
          readOnly
          className="w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-inkmut mb-2"
        />
        <button onClick={signIn} className="btn btn-primary w-full justify-center">
          Continue as Dr. Test Researcher
        </button>
        <p className="text-[11px] text-inkmut mt-3">
          Demo tenant: Demo University — SSO and invitations come with team plans.
        </p>
      </div>
    </div>
  );
}
