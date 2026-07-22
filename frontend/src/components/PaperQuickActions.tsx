"use client";

import {
  BarChart3,
  BookOpenCheck,
  FileQuestion,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  Rows3,
} from "lucide-react";

export type FocusDestination =
  | "insight?view=summary"
  | "insight?view=concepts"
  | "insight?view=gaps"
  | "chat?prompt=explain"
  | "chat?prompt=figures"
  | "chat?prompt=tables"
  | "journal";

const ACTIONS: {
  label: string;
  destination: FocusDestination;
  icon: typeof Lightbulb;
  secondary?: boolean;
}[] = [
  { label: "Summarize", destination: "insight?view=summary", icon: BookOpenCheck },
  { label: "Key concepts", destination: "insight?view=concepts", icon: KeyRound },
  { label: "Explanation", destination: "chat?prompt=explain", icon: FileQuestion },
  { label: "Research gaps", destination: "insight?view=gaps", icon: Lightbulb },
  { label: "Figures", destination: "chat?prompt=figures", icon: ImageIcon, secondary: true },
  { label: "Tables", destination: "chat?prompt=tables", icon: Rows3, secondary: true },
  { label: "Journal fit", destination: "journal", icon: BarChart3, secondary: true },
];

export default function PaperQuickActions({
  onOpen,
  disabled = false,
  active,
  compact = false,
}: {
  onOpen: (destination: FocusDestination) => void;
  disabled?: boolean;
  active?: string | null;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-2" : "mt-5 rounded-xl border border-line bg-surface2/35 p-3"}>
      {!compact && (
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-inkmut">
          Analyze in Focus
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ label, destination, icon: Icon, secondary }) => (
          <button
            key={destination}
            type="button"
            disabled={disabled}
            onClick={() => onOpen(destination)}
            className={`btn btn-outline ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"} ${secondary ? "bg-paper/60 text-inkmut" : "bg-paper"}`}
            title={`${label} in Focus`}
          >
            <Icon className="h-3.5 w-3.5" />
            {active === destination ? "Opening…" : label}
          </button>
        ))}
      </div>
    </div>
  );
}
