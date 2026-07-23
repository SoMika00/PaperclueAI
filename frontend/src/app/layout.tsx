import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider, SignInGate } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { LocaleProvider } from "@/lib/i18n";
import ChatDock from "@/components/ChatDock";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "PaperClue — every claim traced to a real source",
  description:
    "A research workspace for academic writing. Understand your paper, find what's missing, and get it ready to submit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <SignInGate>{children}</SignInGate>
              <ChatDock />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
