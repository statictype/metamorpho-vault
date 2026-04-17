"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";
import type { VaultApiData } from "@/types";

export function useVaultApi(options?: {
  initialData?: VaultApiData;
  initialDataUpdatedAt?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.vaultApi,
    queryFn: () => fetchVaultData(VAULT_ADDRESS),
    staleTime: 30_000,
    refetchInterval: 30_000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
