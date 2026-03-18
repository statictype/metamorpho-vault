"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { VAULT_ADDRESS, USDC_ADDRESS, erc20Abi, metaMorphoAbi } from "@/config/contracts";
import { useAllowance } from "./useAllowance";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

export function useDeposit() {
  const { address } = useAccount();
  const { allowance } = useAllowance();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callsId, setCallsId] = useState<string | undefined>(undefined);
  const confirmToastId = useRef<string | undefined>(undefined);
  const handledId = useRef<string | undefined>(undefined);

  const { sendCallsAsync } = useSendCalls();

  const { data: callsStatus } = useCallsStatus({
    id: callsId as string,
    query: {
      enabled: !!callsId,
      refetchInterval: (data) =>
        data.state.data?.status === "success" || data.state.data?.status === "failure"
          ? false
          : 1500,
    },
  });

  // Derive pending/confirming from query data
  const isConfirming = !!callsId && callsStatus?.status === "pending";
  const isPending = isSubmitting || isConfirming;

  // Handle confirmation side effects (toasts, cache invalidation)
  useEffect(() => {
    if (!callsId || !callsStatus) return;
    if (handledId.current === callsId) return;

    if (callsStatus.status === "success") {
      handledId.current = callsId;
      if (confirmToastId.current) removeToast(confirmToastId.current);
      addToast({
        id: `${callsId}-ok`,
        type: "success",
        title: "Deposit Successful!",
        description: "Your USDC has been deposited into the vault",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPosition });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allowance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaultOnChain });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usdcBalance });
    }

    if (callsStatus.status === "failure") {
      handledId.current = callsId;
      if (confirmToastId.current) removeToast(confirmToastId.current);
      addToast({
        id: `${callsId}-fail`,
        type: "error",
        title: "Deposit Failed",
        description: "Transaction reverted on-chain",
      });
    }
  }, [callsId, callsStatus, addToast, removeToast, queryClient]);

  const needsApproval = (amount: bigint) => {
    if (allowance === undefined) return true;
    return allowance < amount;
  };

  const deposit = async (amount: bigint): Promise<boolean> => {
    if (!address) return false;

    // Reset from any previous deposit
    setCallsId(undefined);
    handledId.current = undefined;
    confirmToastId.current = undefined;
    setIsSubmitting(true);

    const toastId = `deposit-${Date.now()}`;

    try {
      // Build calls array — batch approve + deposit when needed
      const calls: { to: `0x${string}`; data: `0x${string}` }[] = [];

      if (needsApproval(amount)) {
        calls.push({
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [VAULT_ADDRESS, amount],
          }),
        });
      }

      calls.push({
        to: VAULT_ADDRESS,
        data: encodeFunctionData({
          abi: metaMorphoAbi,
          functionName: "deposit",
          args: [amount, address],
        }),
      });

      addToast({
        id: toastId,
        type: "pending",
        title: needsApproval(amount) ? "Approving & Depositing..." : "Depositing USDC...",
        description: "Confirm the transaction in your wallet",
      });

      const result = await sendCallsAsync({
        calls,
        experimental_fallback: true,
      });

      // Wallet accepted — now track on-chain confirmation
      removeToast(toastId);
      const cToastId = `${result.id}-confirming`;
      confirmToastId.current = cToastId;
      addToast({
        id: cToastId,
        type: "pending",
        title: "Confirming deposit...",
        description: "Waiting for on-chain confirmation",
      });

      setCallsId(result.id);
      setIsSubmitting(false);
      return true;
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
        title: isUserRejection ? "Transaction Rejected" : "Deposit Failed",
        description: isUserRejection
          ? "You rejected the transaction in your wallet"
          : error instanceof Error
            ? error.message.slice(0, 100)
            : "An unknown error occurred",
      });

      setIsSubmitting(false);
      return false;
    }
  };

  return {
    deposit,
    isPending,
    isConfirming,
    needsApproval,
  };
}
