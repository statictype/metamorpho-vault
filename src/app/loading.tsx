import {
  HeaderSkeleton,
  VaultHeaderSkeleton,
  VaultStatsSkeleton,
  SharePriceChartSkeleton,
  VaultAllocationsSkeleton,
  ActionPanelSkeleton,
} from "@/components/vault/skeletons";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <VaultHeaderSkeleton />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <VaultStatsSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <SharePriceChartSkeleton />
            <VaultAllocationsSkeleton />
          </div>
          <div>
            <ActionPanelSkeleton />
          </div>
        </div>
      </main>
    </>
  );
}
