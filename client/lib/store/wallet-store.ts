"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  address: string | null;
  walletId: string | null;
  isConnecting: boolean;
  lastError: string | null;
  setConnecting: (v: boolean) => void;
  setConnected: (address: string, walletId: string) => void;
  setError: (message: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletId: null,
      isConnecting: false,
      lastError: null,
      setConnecting: (v) => set({ isConnecting: v, lastError: v ? null : undefined }),
      setConnected: (address, walletId) =>
        set({ address, walletId, isConnecting: false, lastError: null }),
      setError: (message) => set({ lastError: message, isConnecting: false }),
      disconnect: () => set({ address: null, walletId: null, lastError: null }),
    }),
    {
      name: "gigvault-wallet",
      partialize: (state) => ({ address: state.address, walletId: state.walletId }),
    }
  )
);
