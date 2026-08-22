"use client";

import { create } from "zustand";
import type { GigVaultEvent } from "@/types/events";

interface EventsState {
  events: GigVaultEvent[];
  lastLedger: number;
  merge: (incoming: GigVaultEvent[], latestLedger: number) => void;
}

const MAX_EVENTS = 200;

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  lastLedger: 0,
  merge: (incoming, latestLedger) => {
    if (incoming.length === 0) {
      set({ lastLedger: Math.max(get().lastLedger, latestLedger) });
      return;
    }
    const existingIds = new Set(get().events.map((e) => e.id));
    const fresh = incoming.filter((e) => !existingIds.has(e.id));
    if (fresh.length === 0) {
      set({ lastLedger: Math.max(get().lastLedger, latestLedger) });
      return;
    }
    const merged = [...fresh, ...get().events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_EVENTS);
    set({ events: merged, lastLedger: Math.max(get().lastLedger, latestLedger) });
  },
}));
