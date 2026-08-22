import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { server } from "./rpc";
import { CONTRACT_ID } from "./network";
import type { GigVaultEvent, GigVaultEventType } from "@/types/events";

const EVENT_TYPES: GigVaultEventType[] = [
  "init",
  "gig_new",
  "accepted",
  "funded",
  "submitted",
  "approved",
  "disputed",
  "resolved",
  "cancelled",
  "rejected",
  "resubmit",
];

function isKnownType(v: string): v is GigVaultEventType {
  return (EVENT_TYPES as string[]).includes(v);
}

/**
 * Polls Soroban RPC for GigVault contract events starting at `sinceLedger`
 * (inclusive). Pass the last-seen ledger + 1 on each call for incremental
 * polling. Returns events oldest-first.
 */
export async function fetchGigVaultEvents(
  sinceLedger: number,
  contractId: string = CONTRACT_ID
): Promise<{ events: GigVaultEvent[]; latestLedger: number }> {
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(sinceLedger, latest.sequence - 17_280); // RPC retains ~24h of events

  const res = await server.getEvents({
    startLedger,
    filters: [{ type: "contract", contractIds: [contractId] }],
    limit: 100,
  });

  const events: GigVaultEvent[] = [];
  for (const raw of res.events) {
    try {
      const topics = raw.topic.map((t: xdr.ScVal) => scValToNative(t));
      const typeSym = String(topics[0] ?? "");
      if (!isKnownType(typeSym)) continue;

      const actorRaw = topics[1];
      const actor =
        actorRaw && typeof actorRaw === "object" && "toString" in actorRaw
          ? String(actorRaw)
          : String(actorRaw ?? "");

      const value = scValToNative(raw.value);
      let gigId: string | undefined;
      let milestoneIndex: number | undefined;
      let amount: string | undefined;

      if (Array.isArray(value)) {
        if (value[0] !== undefined) gigId = String(value[0]);
        if (value[1] !== undefined && typeof value[1] === "number") milestoneIndex = value[1];
        if (value[2] !== undefined) amount = String(value[2]);
      } else if (value !== undefined) {
        gigId = String(value);
      }

      events.push({
        id: `${raw.id}`,
        type: typeSym,
        ledger: raw.ledger,
        timestamp: new Date(raw.ledgerClosedAt).getTime(),
        txHash: raw.txHash,
        actor,
        gigId,
        milestoneIndex,
        amount,
      });
    } catch {
      // Skip events we can't decode rather than breaking the whole feed.
      continue;
    }
  }

  return { events, latestLedger: latest.sequence };
}
