import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = "https://gigvault-dapp.vercel.app";
const DESCRIPTION =
  "Find Talent, Fund Work — a freelance marketplace on Stellar with milestone escrow, dispute arbitration, and on-chain reputation. No middleman, just code.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GigVault — Freelance escrow on Stellar",
  description: DESCRIPTION,
  openGraph: {
    title: "GigVault — Find Talent, Fund Work",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "GigVault",
    type: "website",
    images: [
      {
        url: "/screenshot.png",
        width: 1342,
        height: 643,
        alt: "GigVault — Find Talent, Fund Work. Freelance escrow on Stellar.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GigVault — Find Talent, Fund Work",
    description: DESCRIPTION,
    images: ["/screenshot.png"],
    creator: "@mishaldotrs",
  },
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
