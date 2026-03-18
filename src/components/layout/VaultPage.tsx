"use client";

import { VaultHeader } from "@/components/vault/VaultHeader";
import { VaultStats } from "@/components/vault/VaultStats";
import { SharePriceChart } from "@/components/vault/SharePriceChart";
import { VaultAllocations } from "@/components/vault/VaultAllocations";
import { ActionPanel } from "@/components/actions/ActionPanel";

export function VaultPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <VaultHeader />
      <VaultStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SharePriceChart />
          <VaultAllocations />
        </div>
        <div>
          <ActionPanel />
        </div>
      </div>
    </main>
  );
}
