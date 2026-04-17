"use client";

import "@/config/appkit";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { Header } from "@/components/layout/Header";

export default function HeaderWithProviders() {
  return (
    <WagmiProvider config={config}>
      <Header />
    </WagmiProvider>
  );
}
