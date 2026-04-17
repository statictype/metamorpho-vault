"use client";

import "@/config/appkit";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ActionPanel } from "@/components/actions/ActionPanel";

export function WalletIsland() {
  return (
    <WagmiProvider config={config}>
      <ToastProvider>
        <ActionPanel />
      </ToastProvider>
    </WagmiProvider>
  );
}
