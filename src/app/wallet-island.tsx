"use client";

import "@/config/appkit";
import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { config } from "@/config/wagmi";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ActionPanel } from "@/components/actions/ActionPanel";

type Props = {
  autoOpen?: boolean;
};

export function WalletIsland({ autoOpen }: Props) {
  return (
    <WagmiProvider config={config}>
      <ToastProvider>
        <ActionPanel />
      </ToastProvider>
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
