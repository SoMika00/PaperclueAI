import type { Config } from "tailwindcss";

/* PaperClue design tokens v2 — high contrast.
   Brand blue is UI-only; provenance colors are reserved and constant:
   amber = university, indigo = public, green = manuscript. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F3F6FA",        // --background (blue-tinted gray)
        paper: "#FFFFFF",        // --surface
        surface2: "#E9EEF5",     // --surface-secondary
        ink: "#101828",          // --text-primary
        inkmut: "#475467",       // --text-secondary
        line: "#CBD5E1",         // --border
        topbar: "#1769E0",       // the blue top bar
        brand: { DEFAULT: "#2F80ED", deep: "#1D5FC4", soft: "#DBEAFE" },
        uni: { DEFAULT: "#D68A19", soft: "#FBF0DC" },
        pub: { DEFAULT: "#3155C6", soft: "#E2E8F8" },
        manuscript: { DEFAULT: "#15956A", soft: "#DCF2EA" },
        aigray: { DEFAULT: "#64748B", soft: "#F1F5F9" },
        danger: "#D64545",
        warn: "#D68A19",
      },
      borderColor: {
        DEFAULT: "#CBD5E1",
      },
      fontFamily: {
        serif: ["Georgia", "Source Serif 4", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        lift: "0 4px 8px -2px rgba(16,24,40,0.10), 0 2px 4px -2px rgba(16,24,40,0.06)",
        drawer: "-8px 0 24px rgba(16,24,40,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
