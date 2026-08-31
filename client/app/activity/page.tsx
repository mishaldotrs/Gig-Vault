import { EventFeed } from "@/components/activity/event-feed";
import { TransactionHistory } from "@/components/activity/transaction-history";

export default function ActivityPage() {
  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted-foreground">
         A live stream of on-chain events, plus every transaction you&apos;ve submitted this session.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EventFeed />
        <TransactionHistory />
      </div>
    </div>
  );
}
