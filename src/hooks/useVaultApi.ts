"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";

export function useVaultApi() {
  return useQuery({
    queryKey: QUERY_KEYS.vaultApi,
    queryFn: () => fetchVaultData(VAULT_ADDRESS),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
