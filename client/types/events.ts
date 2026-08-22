export type GigVaultEventType =
  | "init"
  | "gig_new"
  | "accepted"
  | "funded"
  | "submitted"
  | "approved"
  | "disputed"
  | "resolved"
  | "cancelled"
  | "rejected"
  | "resubmit";

export interface GigVaultEvent {
  id: string;
  type: GigVaultEventType;
  ledger: number;
  timestamp: number;
  txHash: string;
  actor: string;
  gigId?: string;
  milestoneIndex?: number;
  amount?: string;
}

export const EVENT_LABEL: Record<GigVaultEventType, string> = {
  init: "Contract initialized",
  gig_new: "Gig posted",
  accepted: "Gig accepted",
  funded: "Milestone funded",
  submitted: "Milestone submitted",
  approved: "Milestone approved & paid",
  disputed: "Dispute raised",
  resolved: "Dispute resolved",
  cancelled: "Gig cancelled",
  rejected: "Gig rejected — reopened",
  resubmit: "Milestone resubmitted",
};

export type TxStatus = "pending" | "success" | "failed";

export interface TrackedTransaction {
  id: string;
  hash: string | null;
  status: TxStatus;
  label: string;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
}
