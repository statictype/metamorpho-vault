"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVaultAllocations } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";
import type { VaultAllocation } from "@/types";

export function useVaultAllocations(options?: {
  initialData?: VaultAllocation[];
  initialDataUpdatedAt?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.vaultAllocations,
    queryFn: () => fetchVaultAllocations(VAULT_ADDRESS),
    staleTime: 60_000,
    refetchInterval: 60_000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
