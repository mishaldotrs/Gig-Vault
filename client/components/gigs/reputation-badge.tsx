"use client";

import { useReputation } from "@/hooks/use-gigvault";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateAddress } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function ReputationBadge({ address }: { address: string }) {
  const { data, isLoading } = useReputation(address);

  if (isLoading) return <Skeleton className="h-10 w-40" />;
  if (!data) return null;

  const scorePct = Math.round((data.score / 1000) * 100);

  return (
    <div
      className="flex items-center gap-2.5"
      title="Reputation score — everyone starts at 500/1000 (neutral). +25 per completed milestone, +10 per dispute won, −40 per dispute lost."
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-[9rem]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">{truncateAddress(address)}</span>
          <span className="font-medium">
            rep {data.score}
            <span className="text-muted-foreground">/1000</span>
          </span>
        </div>
        <Progress value={scorePct} className="mt-1 h-1.5" />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {data.completed} completed{data.disputedLost > 0 ? ` · ${data.disputedLost} lost dispute(s)` : ""}
        </p>
      </div>
    </div>
  );
}
