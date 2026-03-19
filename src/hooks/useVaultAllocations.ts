"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVaultAllocations } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";

export function useVaultAllocations() {
  return useQuery({
    queryKey: QUERY_KEYS.vaultAllocations,
    queryFn: () => fetchVaultAllocations(VAULT_ADDRESS),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
