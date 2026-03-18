"use client";

import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
  label: string;
  pendingLabel?: string;
  validationError?: string;
}

export function ActionButton({
  onClick,
  disabled,
  isPending,
  label,
  pendingLabel,
  validationError,
}: ActionButtonProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={() => openConnectModal?.()}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  if (validationError) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-lg bg-white/5 text-gray-500 font-medium cursor-not-allowed"
      >
        {validationError}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isPending}
      className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-500 text-white font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isPending && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {isPending ? (pendingLabel || "Pending...") : label}
    </button>
  );
}
