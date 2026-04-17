"use client";

import { useEffect, useState } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { config } from "@/config/wagmi";
import { initAppKit } from "@/config/appkit";
import { shortenAddress } from "@/lib/format";

type Props = { autoOpen: boolean };

const BUTTON_CLASS =
  "h-9 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors";

export default function HeaderConnectButton({ autoOpen }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAppKit();
    setReady(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      {ready ? <ConnectButton autoOpen={autoOpen} /> : <ConnectPlaceholder />}
    </WagmiProvider>
  );
}

function ConnectPlaceholder() {
  return (
    <div className="h-9 w-36 bg-white/10 rounded-lg animate-pulse" aria-hidden />
  );
}

function ConnectButton({ autoOpen }: Props) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  useEffect(() => {
    if (autoOpen) open();
  }, [autoOpen, open]);

  return (
    <button type="button" className={BUTTON_CLASS} onClick={() => open()}>
      {isConnected && address ? shortenAddress(address) : "Connect Wallet"}
    </button>
  );
}
