import { QueryProvider } from "./query-provider";
import { HeaderIsland } from "./header-island";
import { InteractiveShell } from "./interactive-shell";
import { VaultHeaderServer } from "@/components/vault/VaultHeaderServer";
import { VaultStatsServer } from "@/components/vault/VaultStatsServer";
import { SharePriceChartServer } from "@/components/vault/SharePriceChartServer";
import { VaultAllocationsServer } from "@/components/vault/VaultAllocationsServer";
import { ActionPanel } from "@/components/actions/ActionPanel";
import { getStoredConnection } from "@/lib/stored-connection";

export default async function Page() {
  const stored = await getStoredConnection();

  return (
    <QueryProvider>
      <HeaderIsland
        hasStoredConnection={stored.hasStoredConnection}
        address={stored.address}
      />
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
            <InteractiveShell hasStoredConnection={stored.hasStoredConnection}>
              <ActionPanel />
            </InteractiveShell>
          </div>
        </div>
      </main>
    </QueryProvider>
  );
}
