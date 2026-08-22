"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneRail } from "./milestone-rail";
import { ReputationBadge } from "./reputation-badge";
import { GigAttachments } from "./gig-attachments";
import { GigChat } from "./gig-chat";
import { useWallet } from "@/hooks/use-wallet";
import { useGigVaultActions } from "@/hooks/use-gigvault";
import { truncateAddress } from "@/lib/utils";
import { GIG_STATUS_LABEL, GigStatus, MilestoneStatus } from "@/types/contract";
import type { Gig } from "@/types/contract";
import { Loader2, Trash2 } from "lucide-react";

const STATUS_TONE: Record<GigStatus, "default" | "secondary" | "success" | "muted"> = {
  [GigStatus.Open]: "default",
  [GigStatus.InProgress]: "secondary",
  [GigStatus.Completed]: "success",
  [GigStatus.Cancelled]: "muted",
};

export function GigCard({ gig }: { gig: Gig }) {
  const { address, isConnected } = useWallet();
  const actions = useGigVaultActions();

  const isClient = address === gig.client;
  const isFreelancer = address !== null && address === gig.freelancer;
  const canAccept = gig.status === GigStatus.Open && !gig.freelancer && isConnected && !isClient;
  // Only the creator can delete, and only while no freelancer has accepted
  // (once accepted, funds may be in escrow — the milestone flow takes over).
  const canCancel = gig.status === GigStatus.Open && isClient;
  // The assigned freelancer can walk away while in progress (escrow is
  // auto-refunded to the client and the gig reopens), unless a milestone is
  // under dispute.
  const hasDispute = gig.milestones.some((m) => m.status === MilestoneStatus.Disputed);
  const canReject = gig.status === GigStatus.InProgress && isFreelancer && !hasDispute;

  const activeIndex = gig.milestones.findIndex(
    (m) => m.status !== MilestoneStatus.Released && m.status !== MilestoneStatus.Refunded
  );
  const activeMilestone = activeIndex >= 0 ? gig.milestones[activeIndex] : undefined;

  const busy =
    actions.acceptGig.isPending ||
    actions.cancelGig.isPending ||
    actions.rejectGig.isPending ||
    actions.fundMilestone.isPending ||
    actions.submitMilestone.isPending ||
    actions.resubmitMilestone.isPending ||
    actions.approveMilestone.isPending ||
    actions.raiseDispute.isPending ||
    actions.resolveDispute.isPending;

  // When the next move belongs to the other party, show a waiting hint so the
  // card never looks "stuck" with no buttons and no explanation.
  let waitingHint: string | null = null;
  if (gig.status === GigStatus.Open && isClient) {
    waitingHint = "Waiting for a freelancer to accept this gig.";
  } else if (gig.status === GigStatus.Completed) {
    waitingHint = "All milestones released — gig completed. 🎉";
  } else if (activeMilestone && gig.status === GigStatus.InProgress) {
    if (activeMilestone.status === MilestoneStatus.Pending && isFreelancer) {
      waitingHint = `Gig accepted — waiting for the client to fund milestone ${activeIndex + 1} into escrow.`;
    } else if (activeMilestone.status === MilestoneStatus.Funded && isClient) {
      waitingHint = `Milestone ${activeIndex + 1} is escrowed — waiting for the freelancer to submit delivery.`;
    } else if (activeMilestone.status === MilestoneStatus.Submitted && isFreelancer) {
      waitingHint = `Delivery submitted — waiting for the client to approve & release milestone ${activeIndex + 1}.`;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant={STATUS_TONE[gig.status]}>{GIG_STATUS_LABEL[gig.status]}</Badge>
            <Badge variant="outline" className="capitalize">
              {gig.skill.replace(/_/g, " ")}
            </Badge>
          </div>
          <h3 className="font-display text-lg font-semibold">{gig.title}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            client {truncateAddress(gig.client)}
            {gig.freelancer && <> · freelancer {truncateAddress(gig.freelancer)}</>}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">#{gig.id.toString()}</span>
      </CardHeader>

      <CardContent className="space-y-4">
        <GigAttachments gigId={gig.id} />

        <MilestoneRail milestones={gig.milestones} activeIndex={activeIndex >= 0 ? activeIndex : undefined} />

        {gig.freelancer && (
          <div className="rounded-md border border-border bg-surface p-3">
            <ReputationBadge address={gig.freelancer} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {gig.freelancer && (isClient || isFreelancer) && <GigChat gig={gig} highlight={hasDispute} />}

          {canAccept && (
            <Button size="sm" variant="vault" disabled={busy} onClick={() => actions.acceptGig.mutate(gig.id)}>
              {actions.acceptGig.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Accept gig
            </Button>
          )}

          {canReject && (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={busy}
              onClick={() => actions.rejectGig.mutate(gig.id)}
            >
              {actions.rejectGig.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Reject gig
            </Button>
          )}

          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={busy}
              onClick={() => actions.cancelGig.mutate(gig.id)}
            >
              {actions.cancelGig.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete gig
            </Button>
          )}

          {activeMilestone &&
            isClient &&
            gig.status === GigStatus.InProgress &&
            activeMilestone.status === MilestoneStatus.Pending && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => actions.fundMilestone.mutate({ gigId: gig.id, milestoneIndex: activeIndex })}
            >
              {actions.fundMilestone.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Fund milestone {activeIndex + 1}
            </Button>
          )}

          {activeMilestone && isFreelancer && activeMilestone.status === MilestoneStatus.Funded && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => actions.submitMilestone.mutate({ gigId: gig.id, milestoneIndex: activeIndex })}
            >
              {actions.submitMilestone.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit delivery
            </Button>
          )}

          {activeMilestone && isClient && activeMilestone.status === MilestoneStatus.Submitted && (
            <Button
              size="sm"
              variant="vault"
              disabled={busy}
              onClick={() => actions.approveMilestone.mutate({ gigId: gig.id, milestoneIndex: activeIndex })}
            >
              {actions.approveMilestone.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Approve & release
            </Button>
          )}

          {activeMilestone &&
            (isClient || isFreelancer) &&
            (activeMilestone.status === MilestoneStatus.Funded ||
              activeMilestone.status === MilestoneStatus.Submitted) && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => actions.raiseDispute.mutate({ gigId: gig.id, milestoneIndex: activeIndex })}
              >
                Raise dispute
              </Button>
            )}

          {activeMilestone && activeMilestone.status === MilestoneStatus.Disputed && isFreelancer && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => actions.resubmitMilestone.mutate({ gigId: gig.id, milestoneIndex: activeIndex })}
            >
              {actions.resubmitMilestone.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Fix & resubmit
            </Button>
          )}

          {activeMilestone && activeMilestone.status === MilestoneStatus.Disputed && (
            <span className="text-xs text-muted-foreground">
              {isFreelancer
                ? `Milestone ${activeIndex + 1} is disputed — rework the delivery and resubmit, or wait for the arbitrator.`
                : `Milestone ${activeIndex + 1} is disputed — the freelancer can rework & resubmit, or the arbitrator will resolve it.`}
            </span>
          )}

          {waitingHint && <span className="text-xs text-muted-foreground">{waitingHint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
