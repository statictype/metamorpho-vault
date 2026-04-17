"use client";

import { ActionButton } from "./ActionButton";
import { useWithdraw } from "@/hooks/useWithdraw";
import type { UserPosition } from "@/types";

type Props = {
  parsedAmount: bigint | null;
  validationError: string | undefined;
  position: UserPosition | null;
  onSuccess: () => void;
};

export function WithdrawSubmit({
  parsedAmount,
  validationError,
  position,
  onSuccess,
}: Props) {
  const { withdraw, isPending } = useWithdraw();

  const maxAssets = position?.assets ?? BigInt(0);
  const maxShares = position?.shares ?? BigInt(0);

  const handleSubmit = async () => {
    if (!parsedAmount || validationError || maxAssets === BigInt(0)) return;

    // Convert assets amount to shares proportionally
    // shares = (inputAssets * totalShares) / totalAssets
    const sharesToRedeem =
      parsedAmount >= maxAssets
        ? maxShares
        : (parsedAmount * maxShares) / maxAssets;

    const submitted = await withdraw(sharesToRedeem);
    if (submitted) onSuccess();
  };

  return (
    <ActionButton
      onClick={handleSubmit}
      disabled={!!validationError}
      isPending={isPending}
      label="Withdraw"
      pendingLabel="Withdrawing..."
      validationError={validationError}
    />
  );
}
