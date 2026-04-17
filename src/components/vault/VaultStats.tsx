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
  const api = useVaultApi({ initialData, initialDataUpdatedAt });

  return (
    <>
      <StatCard
        label="TVL"
        value={api.data ? formatUsd(api.data.totalAssetsUsd) : ""}
        isLoading={!api.data}
        isError={api.isError}
        onRetry={api.refetch}
      />
      <StatCard
        label="Net APY"
        value={api.data ? formatPercent(api.data.avgNetApy) : ""}
        isLoading={!api.data}
        isError={api.isError}
        onRetry={api.refetch}
      />
      <StatCard
        label="Available Liquidity"
        value={api.data ? formatUsd(api.data.liquidityUsd) : ""}
        isLoading={!api.data}
        isError={api.isError}
        onRetry={api.refetch}
      />
    </>
  );
}
