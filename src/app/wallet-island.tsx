"use client";

import { useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { initAppKit } from "@/config/appkit";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ActionPanel } from "@/components/actions/ActionPanel";
import { ActionPanelSkeleton } from "@/components/vault/skeletons";

export function WalletIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAppKit();
    setReady(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <ToastProvider>
        {ready ? <ActionPanel /> : <ActionPanelSkeleton />}
      </ToastProvider>
    </WagmiProvider>
  );
}
