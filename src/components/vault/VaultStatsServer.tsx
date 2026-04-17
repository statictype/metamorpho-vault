import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { formatUsd, formatPercent } from "@/lib/format";
import { StatCard } from "./StatCard";
import { VaultStats } from "./VaultStats";

export async function VaultStatsServer() {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary");
  const data = await fetchVaultData(VAULT_ADDRESS);

  const serverHtml = (
    <>
      <StatCard label="TVL" value={formatUsd(data.totalAssetsUsd)} />
      <StatCard label="Net APY" value={formatPercent(data.avgNetApy)} />
      <StatCard label="Available Liquidity" value={formatUsd(data.liquidityUsd)} />
    </>
  );

  return (
    <Suspense fallback={serverHtml}>
      <VaultStats initialData={data} initialDataUpdatedAt={Date.now()} />
    </Suspense>
  );
}
