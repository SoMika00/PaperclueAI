"use client";
/* The ONE left menu, identical everywhere. Global destinations never move;
   when a manuscript is open, a "Focus" section appears below with the
   document's features as an indented submenu. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ClipboardCheck,
  FileOutput,
  FileSearch,
  FileText,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  Network,
  Sparkles,
} from "lucide-react";

const GLOBAL = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: FileSearch },
  { href: "/mind-maps", label: "Mind Maps", icon: Network },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/university", label: "University", icon: GraduationCap },
];

const FOCUS = [
  { seg: "overview", label: "Overview", icon: LayoutDashboard },
  { seg: "insight", label: "Paper Insight", icon: Sparkles },
  { seg: "related-research", label: "Related Research", icon: FileSearch },
  { seg: "mind-map", label: "Mind Map", icon: Network },
  { seg: "review", label: "Review", icon: ClipboardCheck },
  { seg: "journal", label: "Journal Format", icon: FileOutput },
  { seg: "versions", label: "Versions", icon: History },
];

export default function Sidebar({
  focus,
}: {
  focus?: { msId: string; title: string };
}) {
  const pathname = usePathname();
  return (
    <nav className="w-52 shrink-0 border-r border-line bg-paper flex flex-col py-3 overflow-y-auto panel-scroll">
      {GLOBAL.map((n) => {
        const active =
          pathname.startsWith(n.href) && !pathname.startsWith("/manuscripts");
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-brand-soft text-brand-deep"
                : "text-inkmut hover:bg-surface2 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}

      {focus && (
        <>
          <div className="mx-4 mt-4 mb-1 border-t border-line pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-inkmut">
              Focus
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink font-medium">
              <FileText className="h-3.5 w-3.5 text-manuscript shrink-0" />
              <span className="line-clamp-2 leading-snug">{focus.title}</span>
            </div>
          </div>
          {FOCUS.map((f) => {
            const active = pathname.includes(`/${f.seg}`);
            const Icon = f.icon;
            return (
              <Link
                key={f.seg}
                href={`/manuscripts/${focus.msId}/${f.seg}`}
                className={`ml-6 mr-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-brand-soft text-brand-deep font-medium"
                    : "text-inkmut hover:bg-surface2 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
