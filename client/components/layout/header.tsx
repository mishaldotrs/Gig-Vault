"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/wallet/wallet-button";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/app", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/activity", label: "Activity" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <VaultMark />
          <span className="text-lg font-extrabold tracking-tight">GigVault</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}

/** The signature mark: a vault-door seal in a Stellar-gold tile. */
export function VaultMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm",
        className
      )}
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="none" stroke="hsl(0 0% 8%)" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="2.4" fill="hsl(0 0% 8%)" />
        <line x1="16" y1="6" x2="16" y2="11" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="21" x2="16" y2="26" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="16" x2="11" y2="16" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="21" y1="16" x2="26" y2="16" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
