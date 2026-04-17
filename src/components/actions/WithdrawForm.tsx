"use client";

import { useState } from "react";
import { AmountInput } from "./AmountInput";
import { WithdrawSubmit } from "./WithdrawSubmit";
import { useUserData } from "@/hooks/useUserData";
import { parseUsdcInput, formatUsdc } from "@/lib/format";
import { formatUnits } from "viem";

export function WithdrawForm() {
  const [amount, setAmount] = useState("");
  const { position } = useUserData();

  const maxAssets = position?.assets ?? BigInt(0);
  const parsedAmount = parseUsdcInput(amount);

  const validationError =
    !amount || !parsedAmount || parsedAmount === BigInt(0)
      ? "Enter an amount"
      : parsedAmount > maxAssets
        ? "Exceeds your position"
        : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <AmountInput
          value={amount}
          onChange={setAmount}
          maxAmount={maxAssets}
          tokenSymbol="USDC"
          label="Withdraw amount"
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
      <WithdrawSubmit
        parsedAmount={parsedAmount}
        validationError={validationError}
        position={position}
        onSuccess={() => setAmount("")}
      />
    </div>
  );
}
