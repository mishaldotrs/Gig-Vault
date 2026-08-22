"use client";

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";
import { NETWORK_PASSPHRASE } from "@/lib/stellar/network";
import { GigVaultError, toGigVaultError } from "@/types/wallet";

let kitInstance: StellarWalletsKit | null = null;

/** Lazily creates a single shared StellarWalletsKit instance (client-only). */
export function getWalletKit(): StellarWalletsKit {
  if (typeof window === "undefined") {
    throw new GigVaultError("UNKNOWN", "Wallet kit can only be used in the browser");
  }
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: undefined,
      modules: allowAllModules(),
    });
    const passphraseOk = NETWORK_PASSPHRASE === WalletNetwork.TESTNET;
    if (!passphraseOk) {
      // Defensive: keep the kit's network in lockstep with our RPC config.
      console.warn("GigVault: wallet network passphrase does not match configured testnet.");
    }
  }
  return kitInstance;
}

export async function openWalletModal(
  onSelect: (walletId: string) => void | Promise<void>
): Promise<void> {
  const kit = getWalletKit();
  try {
    await kit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        kit.setWallet(option.id);
        await onSelect(option.id);
      },
      modalTitle: "Connect a wallet to GigVault",
    });
  } catch (err) {
    throw toGigVaultError(err);
  }
}

export async function connectWallet(walletId: string): Promise<string> {
  const kit = getWalletKit();
  try {
    kit.setWallet(walletId);
    const { address } = await kit.getAddress();
    if (!address) {
      throw new GigVaultError("WALLET_NOT_FOUND", "The wallet returned no address.");
    }
    return address;
  } catch (err) {
    throw toGigVaultError(err);
  }
}

export async function signXdr(
  xdrTx: string,
  address: string,
  walletId?: string | null
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  const kit = getWalletKit();
  try {
    // The kit singleton is recreated on page reload with no wallet selected,
    // while the connected address/walletId are restored from localStorage.
    // Re-select the wallet before signing or the kit rejects the request.
    if (walletId) {
      kit.setWallet(walletId);
    }
    const result = await kit.signTransaction(xdrTx, {
      address,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return { signedTxXdr: result.signedTxXdr, signerAddress: result.signerAddress };
  } catch (err) {
    throw toGigVaultError(err);
  }
}

export function disconnectWallet(): void {
  kitInstance = null;
}
