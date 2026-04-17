"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { FullPageSkeleton } from "@/components/vault/skeletons";

const WalletIsland = dynamic(
  () => import("./wallet-island").then((mod) => mod.WalletIsland),
  { ssr: false, loading: () => <FullPageSkeleton /> }
);

export function InteractiveShell({ children }: { children: ReactNode }) {
  return (
    <WalletIsland>
      <Header />
      {children}
    </WalletIsland>
  );
}
