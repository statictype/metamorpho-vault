"use client";

import { useReadContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, metaMorphoAbi } from "@/config/contracts";
import { useVaultOnChain } from "./useVaultOnChain";
import type { UserPosition } from "@/types";

export function useUserPosition(): {
  position: UserPosition | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { address, isConnected } = useAccount();
  const { totalAssets, totalSupply } = useVaultOnChain();

  const sharesResult = useReadContract({
    address: VAULT_ADDRESS,
    abi: metaMorphoAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15_000,
      staleTime: 12_000,
    },
  });

  const shares = sharesResult.data as bigint | undefined;

  // Compute assets client-side using the ERC-4626 formula rather than a
  // separate convertToAssets() RPC call, since totalAssets and totalSupply
  // are already cached by useVaultOnChain. Avoids a request waterfall.
  const assets =
    shares && totalAssets && totalSupply && totalSupply > BigInt(0)
      ? (shares * totalAssets) / totalSupply
      : undefined;

  const position: UserPosition | null =
    shares !== undefined
      ? {
          shares,
          assets: assets ?? BigInt(0),
        }
      : null;

  return {
    position,
    isLoading: sharesResult.isLoading,
    isError: sharesResult.isError,
    refetch: sharesResult.refetch,
  };
}
