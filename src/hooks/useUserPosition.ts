"use client";

import { useReadContracts, useAccount } from "wagmi";
import { VAULT_ADDRESS, metaMorphoAbi } from "@/config/contracts";
import type { UserPosition } from "@/types";

export function useUserPosition(): {
  position: UserPosition | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { address, isConnected } = useAccount();

  const result = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "convertToAssets",
        // We'll use balanceOf result in a separate call, but for now read with a placeholder
        // Actually we need a two-step approach or read both and compute
        args: [BigInt(0)],
      },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15_000,
      staleTime: 12_000,
    },
  });

  const shares = result.data?.[0]?.result as bigint | undefined;

  // Second call to get actual assets from shares
  const assetsResult = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "convertToAssets",
        args: shares ? [shares] : [BigInt(0)],
      },
    ],
    query: {
      enabled: isConnected && !!address && shares !== undefined && shares > BigInt(0),
      refetchInterval: 15_000,
      staleTime: 12_000,
    },
  });

  const assets = assetsResult.data?.[0]?.result as bigint | undefined;

  const position: UserPosition | null =
    shares !== undefined
      ? {
          shares,
          assets: assets ?? BigInt(0),
        }
      : null;

  return {
    position,
    isLoading: result.isLoading || assetsResult.isLoading,
    isError: result.isError,
    refetch: () => {
      result.refetch();
      assetsResult.refetch();
    },
  };
}
