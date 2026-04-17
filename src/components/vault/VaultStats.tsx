"use client";

import { StatCard } from "./StatCard";
import { useVaultApi } from "@/hooks/useVaultApi";
import { formatUsd, formatPercent } from "@/lib/format";
import type { VaultApiData } from "@/types";

type Props = {
  initialData: VaultApiData;
  initialDataUpdatedAt: number;
};

export function VaultStats({ initialData, initialDataUpdatedAt }: Props) {
  const { data, isError, refetch } = useVaultApi({ initialData, initialDataUpdatedAt });

  return (
    <>
      <StatCard
        label="TVL"
        value={data ? formatUsd(data.totalAssetsUsd) : ""}
        isError={isError}
        onRetry={refetch}
      />
      <StatCard
        label="Net APY"
        value={data ? formatPercent(data.avgNetApy) : ""}
        isError={isError}
        onRetry={refetch}
      />
      <StatCard
        label="Available Liquidity"
        value={data ? formatUsd(data.liquidityUsd) : ""}
        isError={isError}
        onRetry={refetch}
      />
    </>
  );
}
