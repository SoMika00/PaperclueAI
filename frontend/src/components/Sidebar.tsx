"use client";
/* The ONE left menu, identical everywhere. Global destinations never move;
   when a manuscript is open, a "Focus" section appears below with the
   document's features as an indented submenu. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ClipboardCheck,
  Database,
  FileOutput,
  FileSearch,
  FileText,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";

const GLOBAL = [
  { href: "/home", key: "nav_home" as const, icon: Home },
  { href: "/discover", key: "nav_discover" as const, icon: FileSearch },
  { href: "/mind-maps", key: "nav_mindmaps" as const, icon: Network },
  { href: "/library", key: "nav_library" as const, icon: Bookmark },
  { href: "/university", key: "nav_university" as const, icon: GraduationCap },
];

/* PDF-canvas features (chat/insight/review/journal) sit together: switching
   between them keeps the same mounted PDF viewer — no reload. */
const FOCUS = [
  { seg: "overview", label: "Overview", icon: LayoutDashboard },
  { seg: "chat", label: "Chat", icon: MessageSquare },
  { seg: "insight", label: "Paper Insight", icon: Sparkles },
  { seg: "review", label: "Review", icon: ClipboardCheck },
  { seg: "journal", label: "Journal Format", icon: FileOutput },
  { seg: "related-research", label: "Related Research", icon: FileSearch },
  { seg: "mind-map", label: "Mind Map", icon: Network },
  { seg: "versions", label: "Versions", icon: History },
];

export default function Sidebar({
  focus,
}: {
  focus?: { msId: string; title: string };
}) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { t } = useLocale();
  const items = profile?.role === "institution_admin"
    ? [
        { href: "/admin", key: "nav_institution" as const, icon: ShieldCheck },
        { href: "/settings/connections", key: "nav_connections" as const, icon: Database },
      ]
    : GLOBAL;
  return (
    <nav className="w-52 shrink-0 border-r border-line bg-paper flex flex-col py-3 overflow-y-auto panel-scroll dark:bg-dark-surface dark:border-dark-line">
      {items.map((n) => {
        const active =
          pathname.startsWith(n.href) && !pathname.startsWith("/manuscripts");
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-brand-soft text-brand-deep dark:bg-dark-surface2 dark:text-white"
                : "text-inkmut hover:bg-surface2 hover:text-ink dark:text-dark-inkmut dark:hover:bg-dark-surface2 dark:hover:text-dark-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(n.key)}
          </Link>
        );
      })}

      {focus && (
        <>
          <div className="mx-4 mt-4 mb-1 border-t border-line pt-3 dark:border-dark-line">
            <div className="text-[10px] font-bold uppercase tracking-wider text-inkmut dark:text-dark-inkmut">
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
                    ? "bg-brand-soft text-brand-deep font-medium dark:bg-dark-surface2 dark:text-white"
                    : "text-inkmut hover:bg-surface2 hover:text-ink dark:text-dark-inkmut dark:hover:bg-dark-surface2 dark:hover:text-dark-ink"
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
