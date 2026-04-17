"use client";

import { useState } from "react";
import { AmountInput } from "./AmountInput";
import { DepositSubmit } from "./DepositSubmit";
import { useUserData } from "@/hooks/useUserData";
import { parseUsdcInput } from "@/lib/format";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const { balance } = useUserData();

  const parsedAmount = parseUsdcInput(amount);

  const validationError =
    !amount || !parsedAmount || parsedAmount === BigInt(0)
      ? "Enter an amount"
      : balance !== undefined && parsedAmount > balance
        ? "Insufficient USDC balance"
        : undefined;

  return (
    <div className="flex flex-col gap-4">
      <AmountInput
        value={amount}
        onChange={setAmount}
        maxAmount={balance}
        tokenSymbol="USDC"
        label="Deposit amount"
      />
      <DepositSubmit
        parsedAmount={parsedAmount}
        validationError={validationError}
        onSuccess={() => setAmount("")}
      />
    </div>
  );
}
