import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncates a Stellar G... / C... address for display: GABCD…WXYZ */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 1)}…${address.slice(-chars)}`;
}

export function truncateHash(hash: string, chars = 6): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

/** Stroops <-> whole-unit formatting for the escrow token (7 decimals). */
const STROOPS_PER_UNIT = 10_000_000;

export function stroopsToUnits(stroops: bigint | number | string): number {
  const n = typeof stroops === "bigint" ? Number(stroops) : Number(stroops);
  return n / STROOPS_PER_UNIT;
}

export function unitsToStroops(units: number): bigint {
  return BigInt(Math.round(units * STROOPS_PER_UNIT));
}

export function formatAmount(stroops: bigint | number | string): string {
  return stroopsToUnits(stroops).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}

export function explorerContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
