"use client";

import { useReadContracts, useAccount } from "wagmi";
import { USDC_ADDRESS, VAULT_ADDRESS, erc20Abi, metaMorphoAbi } from "@/config/contracts";
import { useVaultOnChain } from "./useVaultOnChain";
import type { UserPosition } from "@/types";

/**
 * Batches all user-specific on-chain reads (USDC balance, allowance, vault
 * shares) into a single multicall to avoid separate RPC round-trips.
 */
export function useUserData() {
  const { address, isConnected } = useAccount();
  const { totalAssets, totalSupply } = useVaultOnChain();

  const result = useReadContracts({
    contracts: [
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: address ? [address, VAULT_ADDRESS] : undefined,
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 12_000,
      staleTime: 12_000,
    },
  });

  const balance = result.data?.[0]?.result as bigint | undefined;
  const allowance = result.data?.[1]?.result as bigint | undefined;
  const shares = result.data?.[2]?.result as bigint | undefined;

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
    balance,
    allowance,
    position,
    isLoading: result.isLoading,
    isError: result.isError,
    refetch: result.refetch,
  };
}
