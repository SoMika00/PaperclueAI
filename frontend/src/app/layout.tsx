import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, SignInGate } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { LocaleProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PaperClue — every claim traced to a real source",
  description:
    "A research workspace for academic writing. Understand your paper, find what's missing, and get it ready to submit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <SignInGate>{children}</SignInGate>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
