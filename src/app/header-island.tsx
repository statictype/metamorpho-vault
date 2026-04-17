"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { Address } from "viem";
import { shortenAddress } from "@/lib/format";

type Props = {
  hasStoredConnection: boolean;
  address?: Address;
};

type HeaderConnectButtonProps = { autoOpen: boolean };

export function HeaderIsland({ hasStoredConnection, address }: Props) {
  const [load, setLoad] = useState(hasStoredConnection);
  const [autoOpen, setAutoOpen] = useState(false);
  const [Loaded, setLoaded] =
    useState<ComponentType<HeaderConnectButtonProps> | null>(null);

  useEffect(() => {
    if (!load || Loaded) return;
    let cancelled = false;
    import("./header-connect-button").then((mod) => {
      if (!cancelled) setLoaded(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [load, Loaded]);

  const prefetch = () => setLoad(true);
  const activate = () => {
    setLoad(true);
    setAutoOpen(true);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">MetaMorpho</span>
        <span className="text-sm text-gray-500">Vault</span>
      </div>
      {Loaded ? (
        <Loaded autoOpen={autoOpen} />
      ) : hasStoredConnection ? (
        <AddressPill address={address} />
      ) : (
        <button
          type="button"
          className="h-9 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors"
          onPointerEnter={prefetch}
          onFocus={prefetch}
          onClick={activate}
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}

function AddressPill({ address }: { address?: Address }) {
  return (
    <div
      aria-label="Wallet connected"
      className="h-9 px-4 flex items-center rounded-lg bg-white/10 text-sm font-medium text-white"
    >
      {address ? shortenAddress(address) : "Connected"}
    </div>
  );
}
