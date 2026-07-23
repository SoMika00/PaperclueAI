/* PaperClue logo — a connected-nodes mark (the "every paper is a network"
   idea) with an orange accent node, plus the wordmark. Navy/ink adapts to
   light/dark via currentColor; the accent node stays orange. Scales with the
   height class passed in (e.g. h-6, h-8). Set `markOnly` for a compact icon. */
export function Logo({
  className = "h-7",
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  if (markOnly) {
    return (
      <svg viewBox="0 0 32 32" className={`${className} w-auto text-ink dark:text-dark-ink`} fill="none" aria-label="PaperClue">
        <line x1="8" y1="9" x2="23" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="8" y1="23" x2="23" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="8" y1="9" x2="8" y2="23" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="8" cy="9" r="3.6" fill="currentColor" />
        <circle cx="8" cy="23" r="3.6" fill="currentColor" />
        <circle cx="23" cy="16" r="4.6" fill="#FF8A3D" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 172 32"
      className={`${className} w-auto text-ink dark:text-dark-ink`}
      fill="none"
      aria-label="PaperClue"
    >
      {/* mark */}
      <line x1="8" y1="9" x2="23" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="8" y1="23" x2="23" y2="16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="8" y1="9" x2="8" y2="23" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="8" cy="9" r="3.6" fill="currentColor" />
      <circle cx="8" cy="23" r="3.6" fill="currentColor" />
      <circle cx="23" cy="16" r="4.6" fill="#FF8A3D" />
      {/* wordmark */}
      <text
        x="40"
        y="23"
        fontFamily="var(--font-source-serif), Georgia, serif"
        fontSize="23"
        fontWeight="700"
        letterSpacing="-0.6"
        fill="currentColor"
      >
        PaperClue
      </text>
    </svg>
  );
}
