"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { VAULT_ADDRESS, metaMorphoAbi } from "@/config/contracts";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

export function useWithdraw() {
  const { address } = useAccount();
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
        title: "Withdrawal Successful!",
        description: "Your USDC has been withdrawn from the vault",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPosition });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaultOnChain });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usdcBalance });
    }

    if (callsStatus.status === "failure") {
      handledId.current = callsId;
      if (confirmToastId.current) removeToast(confirmToastId.current);
      addToast({
        id: `${callsId}-fail`,
        type: "error",
        title: "Withdrawal Failed",
        description: "Transaction reverted on-chain",
      });
    }
  }, [callsId, callsStatus, addToast, removeToast, queryClient]);

  const withdraw = async (shares: bigint): Promise<boolean> => {
    if (!address) return false;

    // Reset from any previous withdrawal
    setCallsId(undefined);
    handledId.current = undefined;
    confirmToastId.current = undefined;
    setIsSubmitting(true);

    const toastId = `withdraw-${Date.now()}`;

    try {
      addToast({
        id: toastId,
        type: "pending",
        title: "Withdrawing...",
        description: "Confirm the transaction in your wallet",
      });

      const result = await sendCallsAsync({
        experimental_fallback: true,
        calls: [
          {
            to: VAULT_ADDRESS,
            data: encodeFunctionData({
              abi: metaMorphoAbi,
              functionName: "redeem",
              args: [shares, address, address],
            }),
          },
        ],
      });

      // Wallet accepted — now track on-chain confirmation
      removeToast(toastId);
      const cToastId = `${result.id}-confirming`;
      confirmToastId.current = cToastId;
      addToast({
        id: cToastId,
        type: "pending",
        title: "Confirming withdrawal...",
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
        title: isUserRejection ? "Transaction Rejected" : "Withdrawal Failed",
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
    withdraw,
    isPending,
    isConfirming,
  };
}
