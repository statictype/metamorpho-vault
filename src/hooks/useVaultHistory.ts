"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVaultHistory } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";
import type { HistoricalDataPoint } from "@/types";

export function useVaultHistory(options?: {
  initialData?: HistoricalDataPoint[];
  initialDataUpdatedAt?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.vaultHistory,
    queryFn: () => fetchVaultHistory(VAULT_ADDRESS),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
