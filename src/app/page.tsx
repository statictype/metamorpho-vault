import { Suspense } from "react";
import { QueryProvider } from "./query-provider";
import { HeaderIsland } from "./header-island";
import { InteractiveShell } from "./interactive-shell";
import { VaultHeaderServer } from "@/components/vault/VaultHeaderServer";
import { VaultStatsServer } from "@/components/vault/VaultStatsServer";
import { SharePriceChartServer } from "@/components/vault/SharePriceChartServer";
import { VaultAllocationsServer } from "@/components/vault/VaultAllocationsServer";
import {
  HeaderSkeleton,
  ActionPanelSkeleton,
} from "@/components/vault/skeletons";
import { getStoredConnection } from "@/lib/stored-connection";

export default function Page() {
  return (
    <QueryProvider>
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderBoundary />
      </Suspense>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <VaultHeaderServer />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <VaultStatsServer />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <SharePriceChartServer />
            <VaultAllocationsServer />
          </div>
          <div>
            <Suspense fallback={<ActionPanelSkeleton />}>
              <InteractiveShellBoundary />
            </Suspense>
          </div>
        </div>
      </main>
    </QueryProvider>
  );
}

async function HeaderBoundary() {
  const stored = await getStoredConnection();
  return (
    <HeaderIsland
      hasStoredConnection={stored.hasStoredConnection}
      address={stored.address}
    />
  );
}

async function InteractiveShellBoundary() {
  const stored = await getStoredConnection();
  return <InteractiveShell hasStoredConnection={stored.hasStoredConnection} />;
}
