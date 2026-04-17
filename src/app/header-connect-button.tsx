"use client";

import "@/config/appkit";
import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { config } from "@/config/wagmi";

type Props = { autoOpen: boolean };

export default function HeaderConnectButton({ autoOpen }: Props) {
  return (
    <WagmiProvider config={config}>
      <appkit-button balance="hide" />
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
