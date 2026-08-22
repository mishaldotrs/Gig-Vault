export enum GigStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum MilestoneStatus {
  Pending = 0,
  Funded = 1,
  Submitted = 2,
  Released = 3,
  Disputed = 4,
  Refunded = 5,
}

export interface Milestone {
  description: string;
  amount: bigint;
  status: MilestoneStatus;
}

export interface Gig {
  id: bigint;
  client: string;
  freelancer: string | null;
  title: string;
  skill: string;
  status: GigStatus;
  milestones: Milestone[];
  createdAt: bigint;
}

export interface Reputation {
  skill: string;
  completed: number;
  disputedWon: number;
  disputedLost: number;
  totalEarned: bigint;
  score: number;
}

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  [MilestoneStatus.Pending]: "Pending",
  [MilestoneStatus.Funded]: "Escrowed",
  [MilestoneStatus.Submitted]: "Submitted",
  [MilestoneStatus.Released]: "Released",
  [MilestoneStatus.Disputed]: "Disputed",
  [MilestoneStatus.Refunded]: "Refunded",
};

export const GIG_STATUS_LABEL: Record<GigStatus, string> = {
  [GigStatus.Open]: "Open",
  [GigStatus.InProgress]: "In progress",
  [GigStatus.Completed]: "Completed",
  [GigStatus.Cancelled]: "Cancelled",
};
