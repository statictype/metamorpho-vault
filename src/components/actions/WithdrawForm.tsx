"use client";

import { useState, useMemo } from "react";
import { AmountInput } from "./AmountInput";
import { ActionButton } from "./ActionButton";
import { useWithdraw } from "@/hooks/useWithdraw";
import { useUserPosition } from "@/hooks/useUserPosition";
import { parseUsdcInput, formatUsdc } from "@/lib/format";
import { formatUnits } from "viem";

export function WithdrawForm() {
  const [amount, setAmount] = useState("");
  const { withdraw, isPending } = useWithdraw();
  const { position } = useUserPosition();

  const maxAssets = position?.assets ?? BigInt(0);
  const maxShares = position?.shares ?? BigInt(0);

  const parsedAmount = useMemo(() => parseUsdcInput(amount), [amount]);

  const validationError = useMemo(() => {
    if (!amount || !parsedAmount || parsedAmount === BigInt(0)) return "Enter an amount";
    if (parsedAmount > maxAssets) return "Exceeds your position";
    return undefined;
  }, [amount, parsedAmount, maxAssets]);

  const handleSubmit = () => {
    if (!parsedAmount || validationError || maxAssets === BigInt(0)) return;

    // Convert assets amount to shares proportionally
    // shares = (inputAssets * totalShares) / totalAssets
    const sharesToRedeem =
      parsedAmount >= maxAssets
        ? maxShares
        : (parsedAmount * maxShares) / maxAssets;

    withdraw(sharesToRedeem);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <AmountInput
          value={amount}
          onChange={setAmount}
          maxAmount={maxAssets}
          tokenSymbol="USDC"
          label="Withdraw amount"
          disabled={isPending}
        />
        {position && position.shares > BigInt(0) && (
          <p className="text-xs text-gray-500 mt-2">
            Your position: {formatUsdc(position.assets)} USDC (
            {Number(formatUnits(position.shares, 18)).toLocaleString("en-US", {
              maximumFractionDigits: 4,
            })}{" "}
            shares)
          </p>
        )}
      </div>
      <ActionButton
        onClick={handleSubmit}
        disabled={!!validationError}
        isPending={isPending}
        label="Withdraw"
        pendingLabel="Withdrawing..."
        validationError={validationError}
      />
    </div>
  );
}
