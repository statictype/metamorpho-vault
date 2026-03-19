"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { readContractsQueryKey } from "wagmi/query";
import { VAULT_ADDRESS, USDC_ADDRESS, erc20Abi, metaMorphoAbi } from "@/config/contracts";
import { useUserData } from "./useUserData";
import { useToast } from "@/components/ui/ToastProvider";
import { QUERY_KEYS } from "@/lib/constants";

// On-chain queries affected by a deposit:
// - useUserData (USDC balance, allowance, vault shares): balance decreases, allowance consumed, shares increase
// - useVaultOnChain (totalAssets, totalSupply): vault totals increase
const DEPOSIT_AFFECTED_KEYS = [
  readContractsQueryKey({ contracts: [{ address: USDC_ADDRESS }] }),
  readContractsQueryKey({ contracts: [{ address: VAULT_ADDRESS }] }),
];

// API queries to refetch after deposit (TVL USD, liquidity, allocations shift)
const DEPOSIT_API_KEYS = [
  QUERY_KEYS.vaultApi,
  QUERY_KEYS.vaultAllocations,
];

export function useDeposit() {
  const { address } = useAccount();
  const { allowance } = useUserData();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callsId, setCallsId] = useState<string | undefined>(undefined);
  const confirmToastId = useRef<string | undefined>(undefined);
  const handledId = useRef<string | undefined>(undefined);

  const { sendCallsAsync } = useSendCalls({
    mutation: {
      onSuccess: () => {
        // Eagerly refetch on-chain data when wallet accepts
        for (const queryKey of DEPOSIT_AFFECTED_KEYS) {
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
        title: "Deposit Successful!",
        description: "Your USDC has been deposited into the vault",
      });
      // Refetch on-chain + API data after confirmation
      for (const queryKey of [...DEPOSIT_AFFECTED_KEYS, ...DEPOSIT_API_KEYS]) {
        queryClient.invalidateQueries({ queryKey });
      }
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

    setCallsId(undefined);
    handledId.current = undefined;
    confirmToastId.current = undefined;
    setIsSubmitting(true);

    const toastId = `deposit-${Date.now()}`;

    try {
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
