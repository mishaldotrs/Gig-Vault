"use client";

import { useTxStore } from "@/lib/store/tx-store";
import { TxStatusBadge, TxHashLink } from "./tx-status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { Receipt } from "lucide-react";

export function TransactionHistory() {
  const transactions = useTxStore((s) => s.transactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction history</CardTitle>
        <CardDescription>Every contract call you've submitted this session, tracked live.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.label}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(tx.createdAt)}</p>
                  {tx.errorMessage && (
                    <p className="mt-1 text-xs text-destructive">{tx.errorMessage}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <TxHashLink hash={tx.hash} />
                  <TxStatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
      <Receipt className="h-8 w-8 opacity-40" />
      <p className="text-sm">No transactions yet.</p>
      <p className="text-xs">Post a gig or fund a milestone to see it tracked here.</p>
    </div>
  );
}
