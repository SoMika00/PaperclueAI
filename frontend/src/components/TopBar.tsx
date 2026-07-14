"use client";
/* The blue top bar: brand, + Upload as the primary action, and the account
   menu (auto-connected demo user, sign out / sign in template). */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function TopBar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  return (
    <>
      <header className="h-14 shrink-0 bg-topbar text-white flex items-center px-4 gap-3 shadow-md z-40 relative">
        <Link href="/home" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center font-serif font-bold">
            P
          </span>
          <span className="font-serif font-bold text-lg tracking-tight">PaperClue</span>
        </Link>
        <span className="hidden md:block text-[12px] text-white/70 ml-2">
          Every claim traced to a real source
        </span>

        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-white/10 transition-colors"
          >
            <span className="h-8 w-8 rounded-full bg-white/25 grid place-items-center text-xs font-bold">
              {user?.initials || <User className="h-4 w-4" />}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-white/70" />
          </button>
          {menuOpen && user && (
            <div className="absolute right-0 top-11 w-60 card shadow-drawer text-ink py-1 z-50">
              <div className="px-3.5 py-2.5 border-b border-line">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-[11px] text-inkmut">{user.email}</div>
                <div className="text-[11px] text-inkmut mt-0.5">
                  <span className="badge badge-university">{user.tenant}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-inkmut hover:bg-surface2 hover:text-ink transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
