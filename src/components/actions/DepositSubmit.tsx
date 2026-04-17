"use client";

import { ActionButton } from "./ActionButton";
import { useDeposit } from "@/hooks/useDeposit";

type Props = {
  parsedAmount: bigint | null;
  validationError: string | undefined;
  onSuccess: () => void;
};

export function DepositSubmit({ parsedAmount, validationError, onSuccess }: Props) {
  const { deposit, isPending, isConfirming, needsApproval } = useDeposit();

  const buttonLabel = !parsedAmount
    ? "Enter an amount"
    : needsApproval(parsedAmount)
      ? "Approve & Deposit"
      : "Deposit";

  const pendingLabel = isConfirming ? "Confirming..." : "Depositing...";

  const handleSubmit = async () => {
    if (!parsedAmount || validationError) return;
    const submitted = await deposit(parsedAmount);
    if (submitted) onSuccess();
  };

  return (
    <ActionButton
      onClick={handleSubmit}
      disabled={!!validationError}
      isPending={isPending}
      label={buttonLabel}
      pendingLabel={pendingLabel}
      validationError={validationError}
    />
  );
}
