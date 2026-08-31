import { WalletOverview } from "@/components/dashboard/wallet-overview";
import { ReputationOverview } from "@/components/dashboard/reputation-overview";
import { TransactionHistory } from "@/components/activity/transaction-history";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CONTRACT_ID, NETWORK_LABEL, explorerContract, isContractConfigured } from "@/lib/stellar/network";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your wallet, your on-chain reputation, and this session&apos;s transactions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <WalletOverview />
          <ReputationOverview />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Network</CardTitle>
              <CardDescription>{NETWORK_LABEL}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract</span>
                {isContractConfigured() ? (
                  <a
                    href={explorerContract(CONTRACT_ID)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    {CONTRACT_ID.slice(0, 6)}…{CONTRACT_ID.slice(-4)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Badge variant="muted">Not deployed</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
