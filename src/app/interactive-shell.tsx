"use client";

import dynamic from "next/dynamic";
import { ActionPanelSkeleton } from "@/components/vault/skeletons";

const WalletIsland = dynamic(
  () => import("./wallet-island").then((mod) => mod.WalletIsland),
  { ssr: false, loading: () => <ActionPanelSkeleton /> },
);

export function InteractiveShell() {
  return <WalletIsland />;
}
