"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { VAULT_ADDRESS, metaMorphoAbi } from "@/config/contracts";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

export function useWithdraw() {
  const { address } = useAccount();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isPending, setIsPending] = useState(false);

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const withdraw = useCallback(
    async (shares: bigint) => {
      if (!address) return;

      setIsPending(true);
      const toastId = `withdraw-${Date.now()}`;

      try {
        addToast({
          id: toastId,
          type: "pending",
          title: "Withdrawing...",
          description: "Confirm the transaction in your wallet",
        });

        const tx = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: metaMorphoAbi,
          functionName: "redeem",
          args: [shares, address, address],
        });

        removeToast(toastId);
        addToast({
          id: `${toastId}-ok`,
          type: "success",
          title: "Withdrawal Successful!",
          description: "Your USDC has been withdrawn from the vault",
          txHash: tx,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPosition });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaultOnChain });
      } catch (error: unknown) {
        removeToast(toastId);

        const isUserRejection =
          error instanceof Error &&
          (error.message.includes("User rejected") ||
            error.message.includes("user rejected") ||
            error.message.includes("ACTION_REJECTED"));

        addToast({
          id: `${toastId}-error`,
          type: "error",
          title: isUserRejection ? "Transaction Rejected" : "Withdrawal Failed",
          description: isUserRejection
            ? "You rejected the transaction in your wallet"
            : error instanceof Error
              ? error.message.slice(0, 100)
              : "An unknown error occurred",
        });
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContractAsync, addToast, removeToast, queryClient]
  );

  return {
    withdraw,
    isPending,
    isConfirming,
  };
}
