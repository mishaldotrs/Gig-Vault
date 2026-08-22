"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGigVaultEvents } from "@/lib/stellar/events";
import { useEventsStore } from "@/lib/store/events-store";
import { isContractConfigured } from "@/lib/stellar/network";

const POLL_INTERVAL_MS = 6000;

/** Polls the chain for new GigVault events and keeps the shared feed store fresh. */
export function useEvents() {
  const { events, lastLedger, merge } = useEventsStore();
  const initializedRef = useRef(false);

  const query = useQuery({
    queryKey: ["gigvault-events", lastLedger],
    queryFn: async () => {
      const startLedger = initializedRef.current ? lastLedger + 1 : 0;
      const result = await fetchGigVaultEvents(startLedger);
      initializedRef.current = true;
      return result;
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    enabled: isContractConfigured(),
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      merge(query.data.events, query.data.latestLedger);
    }
  }, [query.data, merge]);

  return {
    events,
    isLoading: query.isLoading && events.length === 0,
    isError: query.isError,
    isPolling: query.isFetching,
  };
}
