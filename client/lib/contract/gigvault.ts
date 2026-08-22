import { nativeToScVal, xdr, Address } from "@stellar/stellar-sdk";
import { callView, callWrite, type SignFn } from "@/lib/stellar/rpc";
import { CONTRACT_ID } from "@/lib/stellar/network";
import type { Gig, Milestone, Reputation } from "@/types/contract";

function addrStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Address) return value.toString();
  if (value && typeof (value as { toString(): string }).toString === "function") {
    return (value as { toString(): string }).toString();
  }
  return String(value);
}

function mapMilestone(raw: Record<string, unknown>): Milestone {
  return {
    description: String(raw.description ?? ""),
    amount: BigInt(raw.amount as string | number | bigint),
    status: Number(raw.status) as Milestone["status"],
  };
}

function mapGig(raw: Record<string, unknown>): Gig {
  const milestonesRaw = (raw.milestones as Record<string, unknown>[]) ?? [];
  return {
    id: BigInt(raw.id as string | number | bigint),
    client: addrStr(raw.client),
    freelancer: raw.freelancer == null ? null : addrStr(raw.freelancer),
    title: String(raw.title ?? ""),
    skill: String(raw.skill ?? ""),
    status: Number(raw.status) as Gig["status"],
    milestones: milestonesRaw.map(mapMilestone),
    createdAt: BigInt((raw.created_at as string | number | bigint) ?? 0),
  };
}

function mapReputation(raw: Record<string, unknown>): Reputation {
  return {
    skill: String(raw.skill ?? ""),
    completed: Number(raw.completed ?? 0),
    disputedWon: Number(raw.disputed_won ?? 0),
    disputedLost: Number(raw.disputed_lost ?? 0),
    totalEarned: BigInt((raw.total_earned as string | number | bigint) ?? 0),
    score: Number(raw.score ?? 0),
  };
}

// --------------------------------------------------------------------- reads

export async function getGig(gigId: bigint, contractId = CONTRACT_ID): Promise<Gig> {
  const raw = await callView<Record<string, unknown>>(contractId, "get_gig", [
    nativeToScVal(gigId, { type: "u64" }),
  ]);
  return mapGig(raw);
}

export async function getGigCount(contractId = CONTRACT_ID): Promise<bigint> {
  const raw = await callView<string | number | bigint>(contractId, "get_gig_count", []);
  return BigInt(raw);
}

export async function getReputation(
  address: string,
  contractId = CONTRACT_ID
): Promise<Reputation> {
  const raw = await callView<Record<string, unknown>>(contractId, "get_reputation", [
    new Address(address).toScVal(),
  ]);
  return mapReputation(raw);
}

export async function listGigs(contractId = CONTRACT_ID): Promise<Gig[]> {
  const count = await getGigCount(contractId);
  const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
  const gigs = await Promise.allSettled(ids.map((id) => getGig(id, contractId)));
  return gigs
    .filter((r): r is PromiseFulfilledResult<Gig> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => Number(b.id - a.id));
}

// -------------------------------------------------------------------- writes

interface WriteCtx {
  sourceAddress: string;
  signTransaction: SignFn;
  contractId?: string;
  onStatus?: Parameters<typeof callWrite>[5];
}

export async function createGig(
  ctx: WriteCtx,
  params: {
    title: string;
    skill: string;
    milestoneDescriptions: string[];
    milestoneAmounts: bigint[];
  }
) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(params.title, { type: "string" }),
    nativeToScVal(params.skill, { type: "symbol" }),
    nativeToScVal(params.milestoneDescriptions, { type: "string" }),
    nativeToScVal(params.milestoneAmounts, { type: "i128" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "create_gig",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function rejectGig(ctx: WriteCtx, gigId: bigint) {
  const args = [new Address(ctx.sourceAddress).toScVal(), nativeToScVal(gigId, { type: "u64" })];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "reject_gig",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function cancelGig(ctx: WriteCtx, gigId: bigint) {
  const args = [new Address(ctx.sourceAddress).toScVal(), nativeToScVal(gigId, { type: "u64" })];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "cancel_gig",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function acceptGig(ctx: WriteCtx, gigId: bigint) {
  const args = [new Address(ctx.sourceAddress).toScVal(), nativeToScVal(gigId, { type: "u64" })];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "accept_gig",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function fundMilestone(ctx: WriteCtx, gigId: bigint, milestoneIndex: number) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "fund_milestone",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function submitMilestone(ctx: WriteCtx, gigId: bigint, milestoneIndex: number) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "submit_milestone",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function resubmitMilestone(ctx: WriteCtx, gigId: bigint, milestoneIndex: number) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "resubmit_milestone",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function approveMilestone(ctx: WriteCtx, gigId: bigint, milestoneIndex: number) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "approve_milestone",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function raiseDispute(ctx: WriteCtx, gigId: bigint, milestoneIndex: number) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "raise_dispute",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export async function resolveDispute(
  ctx: WriteCtx,
  gigId: bigint,
  milestoneIndex: number,
  favorFreelancer: boolean
) {
  const args = [
    new Address(ctx.sourceAddress).toScVal(),
    nativeToScVal(gigId, { type: "u64" }),
    nativeToScVal(milestoneIndex, { type: "u32" }),
    nativeToScVal(favorFreelancer, { type: "bool" }),
  ];
  return callWrite(
    ctx.contractId ?? CONTRACT_ID,
    "resolve_dispute",
    args,
    ctx.sourceAddress,
    ctx.signTransaction,
    ctx.onStatus
  );
}

export const _internal = { mapGig, mapMilestone, mapReputation, addrStr };
export type { xdr };
