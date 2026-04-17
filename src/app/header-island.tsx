"use client";

import dynamic from "next/dynamic";
import { HeaderSkeleton } from "@/components/vault/skeletons";

const HeaderWithProviders = dynamic(
  () => import("./header-with-providers"),
  { ssr: false, loading: () => <HeaderSkeleton /> }
);

export function HeaderIsland() {
  return <HeaderWithProviders />;
}
