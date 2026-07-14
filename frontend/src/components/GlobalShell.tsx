"use client";
/* Research-space shell: blue top bar + the constant left menu + content. */
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function GlobalShell({ children }: { children: React.ReactNode }) {
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
