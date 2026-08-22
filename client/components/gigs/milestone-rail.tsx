"use client";

import { cn, formatAmount } from "@/lib/utils";
import { MilestoneStatus, MILESTONE_STATUS_LABEL, type Milestone } from "@/types/contract";
import { Check, Lock, Send, AlertTriangle, Undo2 } from "lucide-react";

const SEAL_ICON: Record<MilestoneStatus, React.ComponentType<{ className?: string }>> = {
  [MilestoneStatus.Pending]: Lock,
  [MilestoneStatus.Funded]: Lock,
  [MilestoneStatus.Submitted]: Send,
  [MilestoneStatus.Released]: Check,
  [MilestoneStatus.Disputed]: AlertTriangle,
  [MilestoneStatus.Refunded]: Undo2,
};

const SEAL_TONE: Record<MilestoneStatus, string> = {
  [MilestoneStatus.Pending]: "border-border text-muted-foreground bg-surface",
  [MilestoneStatus.Funded]: "border-primary text-primary bg-surface",
  [MilestoneStatus.Submitted]: "border-primary text-primary-foreground bg-primary",
  [MilestoneStatus.Released]: "border-vault text-vault-foreground bg-vault",
  [MilestoneStatus.Disputed]: "border-destructive text-destructive-foreground bg-destructive",
  [MilestoneStatus.Refunded]: "border-muted-foreground text-muted-foreground bg-surface",
};

export function MilestoneRail({
  milestones,
  activeIndex,
}: {
  milestones: Milestone[];
  activeIndex?: number;
}) {
  return (
    <div className="flex items-stretch gap-0">
      {milestones.map((m, i) => {
        const Icon = SEAL_ICON[m.status];
        const isLast = i === milestones.length - 1;
        return (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                title={MILESTONE_STATUS_LABEL[m.status]}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  SEAL_TONE[m.status],
                  activeIndex === i && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{formatAmount(m.amount)}</span>
            </div>
            {!isLast && <div className="vault-rail mx-1 h-[2px] flex-1 self-start mt-[18px]" />}
          </div>
        );
      })}
    </div>
  );
}
