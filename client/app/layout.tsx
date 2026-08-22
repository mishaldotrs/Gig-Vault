import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "GigVault — Freelance escrow on Stellar",
  description:
    "A freelance marketplace with milestone escrow, dispute arbitration, and skill-based reputation, built on Soroban.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (Grammarly, ColorZilla, …)
          inject attributes into <body> before React hydrates, which would
          otherwise trigger a false-positive hydration mismatch. */}
      <body
        suppressHydrationWarning
        className={`${sans.variable} ${mono.variable} font-sans`}
      >
        <Providers>
          <div className="relative min-h-screen">
            <Header />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
