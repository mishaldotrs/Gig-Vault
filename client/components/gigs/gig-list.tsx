"use client";

import { useMemo } from "react";
import { useGigList } from "@/hooks/use-gigvault";
import { useWallet } from "@/hooks/use-wallet";
import { GigCard } from "./gig-card";
import { CreateGigDialog } from "./create-gig-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PackageOpen, WifiOff } from "lucide-react";
import { isContractConfigured } from "@/lib/stellar/network";
import { GigStatus } from "@/types/contract";

export function GigList() {
  const { data: gigs, isLoading, isError } = useGigList();
  const { address } = useWallet();

  const open = useMemo(() => (gigs ?? []).filter((g) => g.status === GigStatus.Open), [gigs]);
  const mine = useMemo(
    () => (gigs ?? []).filter((g) => g.client === address || g.freelancer === address),
    [gigs, address]
  );
  // Cancelled gigs are hidden from the public "All" tab; their owners can
  // still see them under "My gigs".
  const all = useMemo(() => (gigs ?? []).filter((g) => g.status !== GigStatus.Cancelled), [gigs]);

  if (!isContractConfigured()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
          <WifiOff className="h-8 w-8 opacity-40" />
          <p className="text-sm font-medium text-foreground">Contract not configured</p>
          <p className="max-w-sm text-xs">
            Run <code className="rounded bg-surface px-1 py-0.5">scripts/deploy.sh</code> and set{" "}
            <code className="rounded bg-surface px-1 py-0.5">NEXT_PUBLIC_CONTRACT_ID</code> to start posting gigs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="open" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
              <TabsTrigger value="mine">My gigs ({mine.length})</TabsTrigger>
              <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            </TabsList>
            <CreateGigDialog />
          </div>

          <TabsContent value="open">
            <GigGrid gigs={open} isLoading={isLoading} isError={isError} emptyHint="No open gigs right now — be the first to post one." />
          </TabsContent>
          <TabsContent value="mine">
            <GigGrid
              gigs={mine}
              isLoading={isLoading}
              isError={isError}
              emptyHint="Nothing here yet. Gigs you post or accept will show up in this tab."
            />
          </TabsContent>
          <TabsContent value="all">
            <GigGrid gigs={all} isLoading={isLoading} isError={isError} emptyHint="No gigs posted yet." />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GigGrid({
  gigs,
  isLoading,
  isError,
  emptyHint,
}: {
  gigs: ReturnType<typeof useGigList>["data"];
  isLoading: boolean;
  isError: boolean;
  emptyHint: string;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
          <WifiOff className="h-8 w-8 opacity-40" />
          <p className="text-sm">Couldn&apos;t reach the network. Check your connection and try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!gigs || gigs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
          <PackageOpen className="h-8 w-8 opacity-40" />
          <p className="text-sm">{emptyHint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {gigs.map((gig) => (
        <GigCard key={gig.id.toString()} gig={gig} />
      ))}
    </div>
  );
}
