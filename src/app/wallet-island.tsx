"use client";

import "@/config/appkit";
import { useEffect, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { config } from "@/config/wagmi";
import { ToastProvider } from "@/components/ui/ToastProvider";

type Props = {
  children: ReactNode;
  autoOpen?: boolean;
};

export function WalletIsland({ children, autoOpen }: Props) {
  return (
    <WagmiProvider config={config}>
      <ToastProvider>{children}</ToastProvider>
      {autoOpen && <OpenOnMount />}
    </WagmiProvider>
  );
}

function OpenOnMount() {
  const { open } = useAppKit();
  useEffect(() => {
    open();
  }, [open]);
  return null;
}
