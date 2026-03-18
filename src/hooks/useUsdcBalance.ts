"use client";

import { useReadContract, useAccount } from "wagmi";
import { USDC_ADDRESS, erc20Abi } from "@/config/contracts";

export function useUsdcBalance() {
  const { address, isConnected } = useAccount();

  const result = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15_000,
      staleTime: 12_000,
    },
  });

  return {
    balance: result.data as bigint | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
