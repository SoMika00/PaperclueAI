"use client";

import { BookOpenCheck, KeyRound } from "lucide-react";

export type FocusDestination =
  | "insight?view=summary"
  | "insight?view=concepts";

const ACTIONS: {
  label: string;
  destination: FocusDestination;
  icon: typeof BookOpenCheck;
}[] = [
  { label: "Summarize", destination: "insight?view=summary", icon: BookOpenCheck },
  { label: "Key concepts", destination: "insight?view=concepts", icon: KeyRound },
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
    <div className={compact ? "mt-2" : "mt-2"}>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ label, destination, icon: Icon }) => (
          <button
            key={destination}
            type="button"
            disabled={disabled}
            onClick={() => onOpen(destination)}
            className={`btn btn-outline ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"} bg-paper`}
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
