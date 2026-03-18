"use client";

import { StatCard } from "./StatCard";
import { useVaultOnChain } from "@/hooks/useVaultOnChain";
import { useVaultApi } from "@/hooks/useVaultApi";
import { formatUsd, formatUsdc, formatPercent } from "@/lib/format";
import { formatUnits } from "viem";

export function VaultStats() {
  const onChain = useVaultOnChain();
  const api = useVaultApi();

  const tvlDisplay = onChain.totalAssets
    ? formatUsdc(onChain.totalAssets) + " USDC"
    : undefined;

  const tvlUsd = api.data ? formatUsd(api.data.totalAssetsUsd) : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="TVL"
        value={tvlUsd ?? tvlDisplay ?? ""}
        subValue={tvlUsd && tvlDisplay ? tvlDisplay : undefined}
        isLoading={onChain.isLoading && api.isLoading}
        isError={onChain.isError && api.isError}
      />
      <StatCard
        label="Net APY"
        value={api.data ? formatPercent(api.data.avgNetApy) : ""}
        isLoading={api.isLoading}
        isError={api.isError}
      />
      <StatCard
        label="Available Liquidity"
        value={api.data ? formatUsd(api.data.liquidityUsd) : ""}
        isLoading={api.isLoading}
        isError={api.isError}
      />
      <StatCard
        label="Total Supply"
        value={
          onChain.totalSupply
            ? Number(formatUnits(onChain.totalSupply, 18)).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              }) + " shares"
            : ""
        }
        isLoading={onChain.isLoading}
        isError={onChain.isError}
      />
    </div>
  );
}
