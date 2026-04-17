"use client";

import "@/config/appkit";
import { useEffect } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { config } from "@/config/wagmi";
import { shortenAddress } from "@/lib/format";

type Props = { autoOpen: boolean };

const BUTTON_CLASS =
  "h-9 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors";

export default function HeaderConnectButton({ autoOpen }: Props) {
  return (
    <WagmiProvider config={config}>
      <ConnectButton />
      {autoOpen && <OpenOnMount />}
    </WagmiProvider>
  );
}

function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  return (
    <button type="button" className={BUTTON_CLASS} onClick={() => open()}>
      {isConnected && address ? shortenAddress(address) : "Connect Wallet"}
    </button>
  );
}

function OpenOnMount() {
  const { open } = useAppKit();
  useEffect(() => {
    open();
  }, [open]);
  return null;
}
