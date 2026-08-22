"use client";

import { useState } from "react";
import { Wallet, LogOut, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { truncateAddress } from "@/lib/utils";
import { explorerAccount } from "@/lib/stellar/network";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting} variant="vault" size="sm" className="font-medium">
        <Wallet />
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-ring" />
          {truncateAddress(address ?? "")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono text-xs">
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? <Check className="text-vault" /> : <Copy />}
          {copied ? "Copied" : "Copy address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerAccount(address ?? "")} target="_blank" rel="noreferrer">
            <ExternalLink />
            View on explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
