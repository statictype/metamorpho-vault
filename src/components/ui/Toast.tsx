"use client";

import type { Toast as ToastData } from "@/types";

const icons: Record<ToastData["type"], string> = {
  pending: "⏳",
  success: "✓",
  error: "✕",
};

const styles: Record<ToastData["type"], string> = {
  pending: "border-blue-500/30 bg-blue-500/10",
  success: "border-green-500/30 bg-green-500/10",
  error: "border-red-500/30 bg-red-500/10",
};

const iconStyles: Record<ToastData["type"], string> = {
  pending: "text-blue-400 animate-spin",
  success: "text-green-400",
  error: "text-red-400",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${styles[toast.type]}`}
    >
      <span className={`text-lg flex-shrink-0 ${iconStyles[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-400 mt-0.5">{toast.description}</p>
        )}
        {toast.txHash && (
          <a
            href={`https://etherscan.io/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
          >
            View on Etherscan
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-500 hover:text-gray-300 text-sm flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
