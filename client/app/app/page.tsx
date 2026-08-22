import { GigList } from "@/components/gigs/gig-list";

export default function MarketplacePage() {
  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-1 text-muted-foreground">
          Post a gig, accept one, and move milestones through escrow — every action confirmed on Stellar Testnet.
        </p>
      </div>
      <GigList />
    </div>
  );
}
