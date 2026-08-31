"use client";

import { useWallet } from "@/hooks/use-wallet";
import { useAccountInfo } from "@/hooks/use-account-info";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/utils";
import { NETWORK_LABEL, explorerAccount } from "@/lib/stellar/network";
import { FRIENDBOT_FUND_URL } from "@/lib/stellar/account";
import { ExternalLink, Droplets, WalletCards } from "lucide-react";

export function WalletOverview() {
  const { address, isConnected, connect } = useWallet();
  const { data, isLoading, isError, refetch } = useAccountInfo(address);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Connect a wallet to see your address, balances, and network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="vault" onClick={connect}>
            <WalletCards />
            Connect wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>{NETWORK_LABEL}</CardDescription>
        </div>
        <Badge variant="outline">{NETWORK_LABEL}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
          <span className="font-mono text-sm">{truncateAddress(address ?? "", 6)}</span>
          <a href={explorerAccount(address ?? "")} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Explorer
            </Button>
          </a>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load balances. Try again shortly.</p>
        ) : data && data.balances.length > 0 ? (
          <div className="space-y-2">
            {data.balances.map((b) => (
              <div key={b.asset} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.asset}</span>
                <span className="font-mono font-tabular">{Number(b.balance).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-6 text-center">
            <p className="text-sm text-muted-foreground">This testnet account isn&apos;t funded yet.</p>
            <a href={FRIENDBOT_FUND_URL(address ?? "")} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" onClick={() => setTimeout(() => refetch(), 3000)}>
                <Droplets className="h-3.5 w-3.5" />
                Fund with Friendbot
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
