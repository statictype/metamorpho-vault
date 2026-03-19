"use client";

import { useState } from "react";
import { AmountInput } from "./AmountInput";
import { ActionButton } from "./ActionButton";
import { useDeposit } from "@/hooks/useDeposit";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { parseUsdcInput } from "@/lib/format";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const { balance } = useUsdcBalance();
  const { deposit, isPending, isConfirming, needsApproval } = useDeposit();

  const parsedAmount = parseUsdcInput(amount);

  const validationError =
    !amount || !parsedAmount || parsedAmount === BigInt(0)
      ? "Enter an amount"
      : balance !== undefined && parsedAmount > balance
        ? "Insufficient USDC balance"
        : undefined;

  const buttonLabel =
    !parsedAmount
      ? "Enter an amount"
      : needsApproval(parsedAmount)
        ? "Approve & Deposit"
        : "Deposit";

  const pendingLabel = isConfirming ? "Confirming..." : "Depositing...";

  const handleSubmit = async () => {
    if (!parsedAmount || validationError) return;
    const submitted = await deposit(parsedAmount);
    if (submitted) setAmount("");
  };

  return (
    <div className="flex flex-col gap-4">
      <AmountInput
        value={amount}
        onChange={setAmount}
        maxAmount={balance}
        tokenSymbol="USDC"
        label="Deposit amount"
        disabled={isPending}

      />
      <ActionButton
        onClick={handleSubmit}
        disabled={!!validationError}
        isPending={isPending}
        label={buttonLabel}
        pendingLabel={pendingLabel}
        validationError={validationError}
      />
    </div>
  );
}
