"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAccountInfo } from "@/lib/stellar/account";

export function useAccountInfo(address: string | null) {
  return useQuery({
    queryKey: ["account-info", address],
    queryFn: () => fetchAccountInfo(address as string),
    enabled: Boolean(address),
    refetchInterval: 15000,
  });
}
