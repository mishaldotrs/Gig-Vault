"use client";

import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TxHashLink } from "./tx-status-badge";
import { EVENT_LABEL } from "@/types/events";
import { truncateAddress, timeAgo } from "@/lib/utils";
import { Radio, Inbox } from "lucide-react";
import { isContractConfigured } from "@/lib/stellar/network";

const EVENT_TONE: Record<string, "default" | "success" | "destructive" | "secondary" | "muted"> = {
  init: "muted",
  gig_new: "default",
  accepted: "secondary",
  funded: "default",
  submitted: "secondary",
  approved: "success",
  disputed: "destructive",
  resolved: "success",
};

export function EventFeed() {
  const { events, isLoading, isPolling } = useEvents();

  if (!isContractConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Deploy the contract and set NEXT_PUBLIC_CONTRACT_ID to see live events.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Live events straight from the GigVault contract.</CardDescription>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Radio className={`h-3.5 w-3.5 ${isPolling ? "text-vault animate-pulse" : ""}`} />
          {isPolling ? "syncing" : "live"}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="relative space-y-0 border-l border-border pl-5">
            {events.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={EVENT_TONE[event.type] ?? "default"}>{EVENT_LABEL[event.type]}</Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(event.timestamp)}</span>
                  {event.gigId !== undefined && (
                    <span className="text-xs text-muted-foreground">· gig #{event.gigId}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-mono text-muted-foreground">{truncateAddress(event.actor)}</span>
                  <TxHashLink hash={event.txHash} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
      <Inbox className="h-8 w-8 opacity-40" />
      <p className="text-sm">No on-chain activity yet.</p>
      <p className="text-xs">Actions like posting or funding a gig will appear here automatically.</p>
    </div>
  );
}
