"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/config/wagmi";
import { Header } from "@/components/layout/Header";

export default function HeaderWithProviders() {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#3b82f6",
          borderRadius: "medium",
        })}
      >
        <Header />
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
