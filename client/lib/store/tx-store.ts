"use client";

import { create } from "zustand";
import type { TrackedTransaction, TxStatus } from "@/types/events";

interface TxState {
  transactions: TrackedTransaction[];
  addPending: (id: string, label: string) => void;
  updateStatus: (id: string, status: TxStatus, patch?: Partial<TrackedTransaction>) => void;
  clear: () => void;
}

export const useTxStore = create<TxState>((set) => ({
  transactions: [],
  addPending: (id, label) =>
    set((state) => ({
      transactions: [
        {
          id,
          hash: null,
          status: "pending" as TxStatus,
          label,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...state.transactions,
      ].slice(0, 50),
    })),
  updateStatus: (id, status, patch) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...patch, status, updatedAt: Date.now() } : tx
      ),
    })),
  clear: () => set({ transactions: [] }),
}));
