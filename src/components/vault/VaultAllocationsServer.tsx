import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultAllocations } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { formatUsd } from "@/lib/format";
import { VaultAllocations } from "./VaultAllocations";

export async function VaultAllocationsServer() {
  "use cache";
  cacheLife({ revalidate: 60, stale: 120, expire: 600 });
  cacheTag("vault-allocations");
  const data = await fetchVaultAllocations(VAULT_ADDRESS);
  const totalAllocation = data.reduce((sum, a) => sum + a.allocation, 0);

  const serverHtml = (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm font-medium text-gray-400 mb-4">Market Allocations</h2>
      <div className="flex flex-col gap-3">
        {data.map((allocation) => {
          const pct = totalAllocation > 0
            ? (allocation.allocation / totalAllocation) * 100
            : 0;
          return (
            <div key={allocation.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white">{allocation.label}</span>
                <span className="text-gray-400">
                  {formatUsd(allocation.allocationUsd ?? 0)}
                  <span className="text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Suspense fallback={serverHtml}>
      <VaultAllocations initialData={data} initialDataUpdatedAt={Date.now()} />
    </Suspense>
  );
}
