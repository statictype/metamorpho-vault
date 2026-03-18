"use client";

import { useVaultAllocations } from "@/hooks/useVaultAllocations";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatUsd } from "@/lib/format";

export function VaultAllocations() {
  const { data, isLoading, isError } = useVaultAllocations();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Market Allocations</h3>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Market Allocations</h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          Data unavailable
        </div>
      </div>
    );
  }

  const totalAllocation = data.reduce((sum, a) => sum + a.allocation, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Market Allocations</h3>
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
                  <span className="text-gray-500 ml-2">{pct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
