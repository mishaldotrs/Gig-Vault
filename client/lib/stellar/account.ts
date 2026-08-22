import { Horizon } from "@stellar/stellar-sdk";
import { HORIZON_URL } from "./network";
import type { WalletAccountInfo, WalletBalance } from "@/types/wallet";

const horizon = new Horizon.Server(HORIZON_URL);

export async function fetchAccountInfo(address: string): Promise<WalletAccountInfo> {
  try {
    const account = await horizon.loadAccount(address);
    const balances: WalletBalance[] = account.balances.map((b) => {
      if (b.asset_type === "native") {
        return { asset: "XLM", balance: b.balance };
      }
      const withCode = b as { asset_code?: string };
      return { asset: withCode.asset_code ?? "Unknown", balance: b.balance };
    });
    return { address, balances, network: "testnet" };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      // Unfunded testnet account — a normal state before using Friendbot.
      return { address, balances: [], network: "testnet" };
    }
    throw err;
  }
}

export const FRIENDBOT_FUND_URL = (address: string) =>
  `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`;
