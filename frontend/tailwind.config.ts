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
