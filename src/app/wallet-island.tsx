"use client";

import "@/config/appkit";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function WalletIsland({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <ToastProvider>{children}</ToastProvider>
    </WagmiProvider>
  );
}
