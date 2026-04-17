import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultHistory } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { SharePriceChart } from "./SharePriceChart";
import { SharePriceChartSkeleton } from "./skeletons";

export async function SharePriceChartServer() {
  "use cache";
  cacheLife({ revalidate: 300, stale: 600, expire: 3600 });
  cacheTag("vault-history");
  const data = await fetchVaultHistory(VAULT_ADDRESS);

  return (
    <Suspense fallback={<SharePriceChartSkeleton />}>
      <SharePriceChart initialData={data} initialDataUpdatedAt={Date.now()} />
    </Suspense>
  );
}
