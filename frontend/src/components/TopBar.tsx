"use client";
/* The top bar: brand, dark mode toggle, and the account menu. White in light
   mode, deep navy in dark mode, matching the logo either way. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/i18n";

function roleLabel(role?: string) {
  if (role === "institution_admin") return "Admin";
  if (role === "teacher") return "Teacher";
  if (role === "student") return "Student";
  return null;
}

export default function TopBar() {
  const { session, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { locale, t, toggle: toggleLocale } = useLocale();
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
      <header className="h-14 shrink-0 bg-white text-ink dark:bg-topbar dark:text-white flex items-center px-4 gap-3 shadow-md z-40 relative border-b border-line dark:border-none">
        <Link href="/home" className="flex items-center gap-2">
          <img src="/paperclue/paperclue-logo.png" alt="PaperClue" className="h-6 w-auto" />
        </Link>

        <button
          onClick={toggleLocale}
          className="ml-auto flex items-center justify-center h-8 px-2 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle language"
        >
          {locale === "en" ? "日本語" : "English"}
        </button>
        <button
          onClick={toggle}
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="h-8 w-8 rounded-full bg-brand-soft text-brand-deep dark:bg-white/25 dark:text-white grid place-items-center text-xs font-bold">
              {session?.user.email ? session.user.email[0].toUpperCase() : <User className="h-4 w-4" />}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-inkmut dark:text-white/70" />
          </button>
          {menuOpen && session && (
            <div className="absolute right-0 top-11 w-60 card shadow-drawer text-ink py-1 z-50">
              <div className="px-3.5 py-2.5 border-b border-line dark:border-dark-line">
                <div className="text-sm font-semibold dark:text-dark-ink">
                  {profile?.full_name || session?.user.email?.split("@")[0]}
                </div>
                <div className="text-[11px] text-inkmut dark:text-dark-inkmut">
                  {profile?.institution_name || "No institution"}
                  {roleLabel(profile?.role) && (
                    <span className="ml-1.5 uppercase tracking-wide text-[10px] font-semibold text-brand-deep">
                      {roleLabel(profile?.role)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-inkmut hover:bg-surface2 hover:text-ink dark:hover:bg-dark-surface2 dark:hover:text-dark-ink transition-colors"
              >
                <LogOut className="h-4 w-4" /> {t("signout")}
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
