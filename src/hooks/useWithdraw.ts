"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { readContractQueryKey, readContractsQueryKey } from "wagmi/query";
import { VAULT_ADDRESS, USDC_ADDRESS, metaMorphoAbi } from "@/config/contracts";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

// On-chain queries affected by a withdrawal:
// - USDC balanceOf: increases by redeemed amount
// - Vault balanceOf + convertToAssets (useUserPosition): user loses shares
// - Vault totalAssets + totalSupply (useVaultOnChain): vault totals decrease
const WITHDRAW_AFFECTED_KEYS = [
  readContractQueryKey({ address: USDC_ADDRESS, functionName: "balanceOf" }),
  readContractsQueryKey({ contracts: [{ address: VAULT_ADDRESS }] }),
];

// API queries to refetch after withdrawal (TVL USD, liquidity, allocations shift)
const WITHDRAW_API_KEYS = [
  QUERY_KEYS.vaultApi,
  QUERY_KEYS.vaultAllocations,
];

export function useWithdraw() {
  const { address } = useAccount();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callsId, setCallsId] = useState<string | undefined>(undefined);
  const confirmToastId = useRef<string | undefined>(undefined);
  const handledId = useRef<string | undefined>(undefined);

  const { sendCallsAsync } = useSendCalls({
    mutation: {
      onSuccess: () => {
        for (const queryKey of WITHDRAW_AFFECTED_KEYS) {
          queryClient.invalidateQueries({ queryKey });
        }
      },
    },
  });

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

  const isConfirming = !!callsId && callsStatus?.status === "pending";
  const isPending = isSubmitting || isConfirming;

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
      for (const queryKey of [...WITHDRAW_AFFECTED_KEYS, ...WITHDRAW_API_KEYS]) {
        queryClient.invalidateQueries({ queryKey });
      }
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
