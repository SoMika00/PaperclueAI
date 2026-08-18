import type { Config } from "tailwindcss";

/* PaperClue design tokens — our design language (navy + orange, IBM Plex Sans
   + Source Serif) mapped onto the existing token NAMES so the whole app
   reskins without touching each file's classes.
   Provenance colors stay semantically reserved and constant:
   amber = university, blue = public, teal = manuscript. */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAFAFA",        // app background
        paper: "#FFFFFF",        // surfaces / cards
        surface2: "#F2F4F8",     // subtle fills / hovers
        ink: "#14213D",          // primary text / navy
        inkmut: "#5B6B8C",       // secondary text (muted navy)
        line: "#EAEAEA",         // borders
        topbar: "#14213D",       // navy chrome (sidebar / topbar in dark)
        // Brand = our orange accent — drives primary buttons + active nav.
        brand: { DEFAULT: "#FF8A3D", deep: "#F5761F", soft: "#FFE9D9" },
        accent: { DEFAULT: "#FF8A3D", light: "#FF9D5C" },
        // Provenance (reserved) — retinted to our palette, meaning preserved.
        uni: { DEFAULT: "#E0951A", soft: "#FFF2D6" },        // university
        pub: { DEFAULT: "#3D7DFF", soft: "#E6F0FF" },        // public
        manuscript: { DEFAULT: "#0F9B8E", soft: "#E0F7F4" }, // manuscript
        aigray: { DEFAULT: "#8A8A94", soft: "#F1F5F9" },
        danger: "#E5484D",
        warn: "#E0951A",
        // Marketing-only BLUE theme (original paperclue.ai). Used exclusively on
        // the public landing/legal pages — the logged-in app keeps navy/orange.
        pcblue: {
          DEFAULT: "#4361ee",
          light: "#eaf1ff",
          dark: "#1b2865",
          "dark-light": "rgba(67,97,238,.15)",
        },
        pcblue2: {
          DEFAULT: "#3953af",
          light: "#eaf1ff",
          dark: "#1b2865",
          "dark-light": "rgba(67,97,238,.15)",
        },
        // Original paperclue.ai token names, copied verbatim so the ported
        // marketing components keep their exact classes (theme_primary etc.).
        theme_primary: {
          DEFAULT: "#4361ee",
          light: "#eaf1ff",
          dark: "#1b2865",
          "dark-light": "rgba(67,97,238,.15)",
        },
        theme_secondary: {
          DEFAULT: "#3953af",
          light: "#eaf1ff",
          dark: "#1b2865",
          "dark-light": "rgba(67,97,238,.15)",
        },
        theme_text: {
          light: "#4b5563",
          dark: "#d1d5db",
        },
        // shadcn primitives (ported ui/*) resolve these against the CSS vars
        // scoped under .pc-marketing in globals.css.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#4361ee",
          foreground: "#ffffff",
          light: "#eaf1ff",
          dark: "#1b2865",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Slate scale — marketing neutrals (headings/body/surfaces/borders).
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Dark mode — our navy family.
        dark: {
          bg: "#0F1A30",
          surface: "#14213D",
          surface2: "#1E2E4F",
          ink: "#E7EEF9",
          inkmut: "#9AA7C0",
          line: "#2E3F63",
        },
      },
      borderColor: {
        DEFAULT: "#EAEAEA",
      },
      fontFamily: {
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-plex-sans)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        // Marketing-only font (original paperclue.ai used Inter). Applied via
        // `font-inter` on the public landing/legal pages only.
        inter: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,33,61,0.05), 0 1px 3px rgba(20,33,61,0.08)",
        lift: "0 4px 8px -2px rgba(20,33,61,0.10), 0 2px 4px -2px rgba(20,33,61,0.06)",
        drawer: "-8px 0 24px rgba(20,33,61,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
