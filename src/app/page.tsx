import { Suspense } from "react";
import { QueryProvider } from "./query-provider";
import { HeaderIsland } from "./header-island";
import { InteractiveShell } from "./interactive-shell";
import { VaultHeaderServer } from "@/components/vault/VaultHeaderServer";
import { VaultStatsServer } from "@/components/vault/VaultStatsServer";
import { SharePriceChartServer } from "@/components/vault/SharePriceChartServer";
import { VaultAllocationsServer } from "@/components/vault/VaultAllocationsServer";
import { ActionPanel } from "@/components/actions/ActionPanel";
import {
  VaultHeaderSkeleton,
  VaultStatsSkeleton,
  SharePriceChartSkeleton,
  VaultAllocationsSkeleton,
} from "@/components/vault/skeletons";

export default function Page() {
  return (
    <QueryProvider>
      <HeaderIsland />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<VaultHeaderSkeleton />}>
          <VaultHeaderServer />
        </Suspense>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Suspense fallback={<VaultStatsSkeleton />}>
            <VaultStatsServer />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Suspense fallback={<SharePriceChartSkeleton />}>
              <SharePriceChartServer />
            </Suspense>
            <Suspense fallback={<VaultAllocationsSkeleton />}>
              <VaultAllocationsServer />
            </Suspense>
          </div>
          <div>
            <InteractiveShell>
              <ActionPanel />
            </InteractiveShell>
          </div>
        </div>
      </main>
    </QueryProvider>
  );
}
