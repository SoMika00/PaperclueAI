import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, SignInGate } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PaperClue - Grounded research workspace",
  description:
    "One workspace anchored on your manuscript. Every AI output traceable to a real source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SignInGate>{children}</SignInGate>
        </AuthProvider>
      </body>
    </html>
  );
}
