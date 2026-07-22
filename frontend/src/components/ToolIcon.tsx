/** Tool glyphs traced from the design mockup, colored per tool. */
export function ToolIcon({ id, color, size = 16 }: { id: string; color: string; size?: number }) {
  switch (id) {
    case 'mindmap':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <line x1="8" y1="5" x2="3.5" y2="12" stroke={color} strokeWidth="1.4" />
          <line x1="8" y1="5" x2="12.5" y2="12" stroke={color} strokeWidth="1.4" />
          <circle cx="8" cy="5" r="2.6" fill={color} />
          <circle cx="3.5" cy="12" r="1.8" fill={color} />
          <circle cx="12.5" cy="12" r="1.8" fill={color} />
        </svg>
      )
    case 'insights':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect x="2" y="8" width="3" height="6" rx="1" fill={color} />
          <rect x="6.5" y="4" width="3" height="10" rx="1" fill={color} />
          <rect x="11" y="6" width="3" height="8" rx="1" fill={color} />
        </svg>
      )
    case 'proofreader':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <path
            d="M2.5 8.5l3.5 3.5 7.5-8"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'journal':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect x="3" y="1.5" width="10" height="13" rx="1.5" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="5.5" y1="5" x2="10.5" y2="5" stroke={color} strokeWidth="1.3" />
          <line x1="5.5" y1="8" x2="10.5" y2="8" stroke={color} strokeWidth="1.3" />
          <line x1="5.5" y1="11" x2="8.5" y2="11" stroke={color} strokeWidth="1.3" />
        </svg>
      )
    case 'manuscript':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="5" y1="5" x2="11" y2="5" stroke={color} strokeWidth="1.3" />
          <line x1="5" y1="7.5" x2="11" y2="7.5" stroke={color} strokeWidth="1.3" />
          <path d="M5 11l1.5 1.5L9.5 9.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect x="1.5" y="2.5" width="13" height="9" rx="3" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M5 11.5v3l3-3" fill={color} />
          <circle cx="5.5" cy="7" r="1" fill={color} />
          <circle cx="8" cy="7" r="1" fill={color} />
          <circle cx="10.5" cy="7" r="1" fill={color} />
        </svg>
      )
    default:
      return null
  }
}
