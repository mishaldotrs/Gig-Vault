import contractIds from "@/lib/contract/contract-ids.json";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const NETWORK_LABEL = "Stellar Testnet";

// Falls back to contracts/deploy output committed at build time, but an env
// var always wins so Vercel deployments can point at a freshly deployed id
// without a rebuild of this file.
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || contractIds.testnet?.contractId || "CONTRACT_ADDRESS_HERE";

export const ESCROW_TOKEN_ID =
  process.env.NEXT_PUBLIC_TOKEN_ID || contractIds.testnet?.tokenId || "";

export function isContractConfigured(): boolean {
  return Boolean(CONTRACT_ID) && CONTRACT_ID !== "CONTRACT_ADDRESS_HERE";
}

export function explorerTx(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function explorerContract(id: string) {
  return `https://stellar.expert/explorer/testnet/contract/${id}`;
}

export function explorerAccount(address: string) {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}
