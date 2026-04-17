"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ActionPanelSkeleton } from "@/components/vault/skeletons";

type Props = {
  hasStoredConnection: boolean;
};

type WalletIslandProps = {
  autoOpen?: boolean;
};

export function InteractiveShell({ hasStoredConnection }: Props) {
  const [load, setLoad] = useState(hasStoredConnection);
  const [autoOpen, setAutoOpen] = useState(false);
  const [Loaded, setLoaded] =
    useState<ComponentType<WalletIslandProps> | null>(null);

  useEffect(() => {
    if (!load || Loaded) return;
    let cancelled = false;
    import("./wallet-island").then((mod) => {
      if (!cancelled) setLoaded(() => mod.WalletIsland);
    });
    return () => {
      cancelled = true;
    };
  }, [load, Loaded]);

  if (Loaded) {
    return <Loaded autoOpen={autoOpen} />;
  }

  if (hasStoredConnection) {
    return <ActionPanelSkeleton />;
  }

  const prefetch = () => setLoad(true);
  const activate = () => {
    setLoad(true);
    setAutoOpen(true);
  };

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4"
      onPointerEnter={prefetch}
    >
      <div className="flex rounded-lg bg-white/5 p-1">
        <div className="flex-1 py-2 text-sm font-medium rounded-md bg-white/10 text-white text-center capitalize">
          deposit
        </div>
        <div className="flex-1 py-2 text-sm font-medium text-gray-400 text-center capitalize">
          withdraw
        </div>
      </div>
      <p className="text-sm text-gray-400 text-center py-4">
        Connect your wallet to deposit or withdraw USDC.
      </p>
      <button
        type="button"
        onFocus={prefetch}
        onClick={activate}
        className="h-12 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
      >
        Connect Wallet
      </button>
    </div>
  );
}
