"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { VAULT_ADDRESS, USDC_ADDRESS, erc20Abi, metaMorphoAbi } from "@/config/contracts";
import { useAllowance } from "./useAllowance";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

export function useDeposit() {
  const { address } = useAccount();
  const { allowance, refetch: refetchAllowance } = useAllowance();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "approving" | "depositing">("idle");

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const needsApproval = useCallback(
    (amount: bigint) => {
      if (allowance === undefined) return true;
      return allowance < amount;
    },
    [allowance]
  );

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!address) return;

      setIsPending(true);
      const toastId = `deposit-${Date.now()}`;

      try {
        // Step 1: Approve if needed
        if (needsApproval(amount)) {
          setCurrentStep("approving");
          addToast({
            id: toastId,
            type: "pending",
            title: "Approving USDC...",
            description: "Confirm the approval transaction in your wallet",
          });

          const approveTx = await writeContractAsync({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [VAULT_ADDRESS, amount],
          });

          removeToast(toastId);
          addToast({
            id: `${toastId}-approve-ok`,
            type: "success",
            title: "USDC Approved",
            txHash: approveTx,
          });

          // Wait a moment for state to update
          await refetchAllowance();
        }

        // Step 2: Deposit
        setCurrentStep("depositing");
        const depositToastId = `${toastId}-deposit`;
        addToast({
          id: depositToastId,
          type: "pending",
          title: "Depositing USDC...",
          description: "Confirm the deposit transaction in your wallet",
        });

        const depositTx = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: metaMorphoAbi,
          functionName: "deposit",
          args: [amount, address],
        });

        removeToast(depositToastId);
        addToast({
          id: `${depositToastId}-ok`,
          type: "success",
          title: "Deposit Successful!",
          description: "Your USDC has been deposited into the vault",
          txHash: depositTx,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPosition });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allowance });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaultOnChain });
      } catch (error: unknown) {
        removeToast(toastId);
        removeToast(`${toastId}-deposit`);

        const isUserRejection =
          error instanceof Error &&
          (error.message.includes("User rejected") ||
            error.message.includes("user rejected") ||
            error.message.includes("ACTION_REJECTED"));

        addToast({
          id: `${toastId}-error`,
          type: "error",
          title: isUserRejection ? "Transaction Rejected" : "Deposit Failed",
          description: isUserRejection
            ? "You rejected the transaction in your wallet"
            : error instanceof Error
              ? error.message.slice(0, 100)
              : "An unknown error occurred",
        });
      } finally {
        setIsPending(false);
        setCurrentStep("idle");
      }
    },
    [address, needsApproval, writeContractAsync, addToast, removeToast, queryClient, refetchAllowance]
  );

  return {
    deposit,
    isPending,
    isConfirming,
    currentStep,
    needsApproval,
  };
}
