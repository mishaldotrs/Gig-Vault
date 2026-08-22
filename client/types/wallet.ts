export interface WalletBalance {
  asset: string;
  balance: string;
}

export interface WalletAccountInfo {
  address: string;
  balances: WalletBalance[];
  network: string;
}

export type GigVaultErrorCode =
  | "WALLET_NOT_FOUND"
  | "USER_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "SIMULATION_FAILED"
  | "NETWORK_MISMATCH"
  | "CONTRACT_NOT_CONFIGURED"
  | "UNKNOWN";

export class GigVaultError extends Error {
  code: GigVaultErrorCode;
  cause?: unknown;

  constructor(code: GigVaultErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "GigVaultError";
    this.code = code;
    this.cause = cause;
  }
}

/** Pulls a human-readable message out of Error instances, wallet-kit style
 * plain objects ({ message } / { error: { message } } / { error: "..." }),
 * and anything else — never "[object Object]". */
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
    if (obj.error && typeof obj.error === "object") {
      const inner = obj.error as Record<string, unknown>;
      if (typeof inner.message === "string" && inner.message) return inner.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      /* fall through */
    }
  }
  return String(err);
}

/** GigVault contract error codes (see contracts/gigvault/src/lib.rs) mapped
 * to messages a user can actually act on. */
const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  1: "The contract is already initialized.",
  2: "The contract hasn't been initialized yet.",
  3: "That gig doesn't exist (it may have been removed).",
  4: "That milestone doesn't exist on this gig.",
  5: "Only the gig's client can do this.",
  6: "Only the assigned freelancer can do this.",
  7: "Only the arbitrator can resolve disputes.",
  8: "This gig is not open — it has already been accepted or closed.",
  9: "A freelancer needs to accept this gig before milestones can move.",
  10: "This milestone isn't in the right state for that action (it may have just changed — refresh and retry).",
  11: "Add at least one milestone with a description and amount.",
  12: "Milestone amounts must be greater than zero.",
  13: "Another freelancer already accepted this gig.",
  14: "You're not a participant of this gig.",
};

/** Maps raw wallet-kit / Horizon / Soroban RPC errors to friendly, typed errors. */
export function toGigVaultError(err: unknown): GigVaultError {
  if (err instanceof GigVaultError) return err;

  const message = extractMessage(err);
  const lower = message.toLowerCase();

  // Calling a function that doesn't exist on the deployed contract — almost
  // always the frontend running against an older deployment (stale
  // NEXT_PUBLIC_CONTRACT_ID baked into the dev bundle).
  if (
    lower.includes("missingvalue") ||
    lower.includes("unknown contract function") ||
    lower.includes("trying to call a contract function")
  ) {
    return new GigVaultError(
      "SIMULATION_FAILED",
      "The app is pointing at an outdated contract deployment. Restart the dev server and hard-reload the page to pick up the new contract ID.",
      err
    );
  }

  // Soroban contract errors surface as "Error(Contract, #N)" inside a noisy
  // HostError dump — translate the code instead of showing the raw log.
  const contractErr = message.match(/Error\(Contract, #(\d+)\)/);
  if (contractErr) {
    const code = Number(contractErr[1]);
    return new GigVaultError(
      "SIMULATION_FAILED",
      CONTRACT_ERROR_MESSAGES[code] ?? `The contract rejected this action (error #${code}).`,
      err
    );
  }

  if (lower.includes("no wallet") || lower.includes("not installed") || lower.includes("not found")) {
    return new GigVaultError(
      "WALLET_NOT_FOUND",
      "We couldn't find that wallet extension. Install it or pick another wallet.",
      err
    );
  }

  if (
    lower.includes("user declined") ||
    lower.includes("rejected") ||
    lower.includes("user cancelled") ||
    lower.includes("user canceled") ||
    lower.includes("denied")
  ) {
    return new GigVaultError(
      "USER_REJECTED",
      "Transaction was rejected in your wallet. Nothing was sent.",
      err
    );
  }

  if (
    lower.includes("insufficient") ||
    lower.includes("underfunded") ||
    lower.includes("balance") ||
    lower.includes("tx_insufficient_balance")
  ) {
    return new GigVaultError(
      "INSUFFICIENT_BALANCE",
      "This account doesn't have enough balance to cover the amount plus network fees.",
      err
    );
  }

  if (lower.includes("simulat")) {
    return new GigVaultError(
      "SIMULATION_FAILED",
      "The contract call failed simulation, so it was never submitted. Check the inputs and try again.",
      err
    );
  }

  if (lower.includes("network") && (lower.includes("mismatch") || lower.includes("passphrase"))) {
    return new GigVaultError(
      "NETWORK_MISMATCH",
      "Your wallet is on a different network. Switch it to Stellar Testnet and try again.",
      err
    );
  }

  return new GigVaultError("UNKNOWN", message || "Something went wrong. Please try again.", err);
}
