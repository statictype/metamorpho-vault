"use client";

import { useReadContract, useAccount } from "wagmi";
import { USDC_ADDRESS, VAULT_ADDRESS, erc20Abi } from "@/config/contracts";

export function useAllowance() {
  const { address, isConnected } = useAccount();

  const result = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10_000,
      staleTime: 5_000,
    },
  });

  return {
    allowance: result.data as bigint | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
