"use client";

import { useState, useMemo } from "react";
import { AmountInput } from "./AmountInput";
import { ActionButton } from "./ActionButton";
import { useDeposit } from "@/hooks/useDeposit";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useAllowance } from "@/hooks/useAllowance";
import { parseUsdcInput } from "@/lib/format";

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const { balance } = useUsdcBalance();
  const { deposit, isPending, currentStep, needsApproval } = useDeposit();
  const { allowance } = useAllowance();

  const parsedAmount = useMemo(() => parseUsdcInput(amount), [amount]);

  const validationError = useMemo(() => {
    if (!amount || !parsedAmount || parsedAmount === BigInt(0)) return "Enter an amount";
    if (balance !== undefined && parsedAmount > balance) return "Insufficient USDC balance";
    return undefined;
  }, [amount, parsedAmount, balance]);

  const buttonLabel = useMemo(() => {
    if (!parsedAmount) return "Enter an amount";
    if (needsApproval(parsedAmount)) return "Approve & Deposit";
    return "Deposit";
  }, [parsedAmount, needsApproval]);

  const pendingLabel = currentStep === "approving" ? "Approving..." : "Depositing...";

  const handleSubmit = () => {
    if (!parsedAmount || validationError) return;
    deposit(parsedAmount);
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
