"use client";

import { useWallet } from "@/hooks/use-wallet";
import { useReputation } from "@/hooks/use-gigvault";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/utils";
import { isContractConfigured } from "@/lib/stellar/network";
import { ShieldCheck } from "lucide-react";

export function ReputationOverview() {
  const { address, isConnected } = useWallet();
  const { data, isLoading } = useReputation(isConnected ? address : null);

  if (!isConnected || !isContractConfigured()) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Reputation
        </CardTitle>
        <CardDescription>Skill-based score, earned from completed and disputed milestones.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : data ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-semibold">{data.score}</span>
                <span className="text-xs text-muted-foreground">out of 1000 · 500 = neutral</span>
              </div>
              <Progress value={(data.score / 1000) * 100} className="mt-2" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                +25 per completed milestone · +10 per dispute won · −40 per dispute lost
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-surface p-2">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-mono font-medium">{data.completed}</dd>
              </div>
              <div className="rounded-md bg-surface p-2">
                <dt className="text-muted-foreground">Disputes lost</dt>
                <dd className="font-mono font-medium">{data.disputedLost}</dd>
              </div>
              <div className="rounded-md bg-surface p-2">
                <dt className="text-muted-foreground">Earned</dt>
                <dd className="font-mono font-medium">{formatAmount(data.totalEarned)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
