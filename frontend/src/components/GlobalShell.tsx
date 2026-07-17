"use client";
/* Research-space shell: blue top bar + the constant left menu + content.
   Institution admins only manage their institution — bounce them to /admin
   if they land anywhere outside the admin surface (research features are
   also blocked server-side; this just avoids a broken UI). */
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/auth";

const ADMIN_ALLOWED_PREFIXES = ["/admin", "/settings/connections"];

export default function GlobalShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== "institution_admin") return;
    if (ADMIN_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    router.replace("/admin");
  }, [profile, pathname, router]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto panel-scroll">{children}</main>
      </div>
    </div>
  );
}
