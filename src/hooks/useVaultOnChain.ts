"use client";

import { useReadContracts } from "wagmi";
import { VAULT_ADDRESS, metaMorphoAbi } from "@/config/contracts";

export function useVaultOnChain() {
  const result = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "totalAssets",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "totalSupply",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "asset",
      },
    ],
    query: {
      refetchInterval: 12_000,
      staleTime: 12_000,
    },
  });

  const totalAssets = result.data?.[0]?.result as bigint | undefined;
  const totalSupply = result.data?.[1]?.result as bigint | undefined;
  const asset = result.data?.[2]?.result as `0x${string}` | undefined;

  return {
    totalAssets,
    totalSupply,
    asset,
    isLoading: result.isLoading,
    isError: result.isError,
    refetch: result.refetch,
  };
}
