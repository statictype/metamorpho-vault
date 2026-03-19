export interface VaultApiData {
  address: string;
  name: string;
  symbol: string;
  totalAssetsUsd: number;
  totalAssets: string;
  liquidity: string;
  liquidityUsd: number;
  avgNetApy: number;
  curator: { name: string } | null;
  asset: {
    address: string;
    symbol: string;
    decimals: number;
    priceUsd: number;
  };
}

export interface HistoricalDataPoint {
  timestamp: number;
  date: string;
  sharePrice: number;
  apy: number;
}

export interface UserPosition {
  shares: bigint;
  assets: bigint;
}

export interface VaultAllocation {
  type: string;
  allocation: number;
  allocationUsd: number | null;
  label: string;
}

export type ToastType = "pending" | "success" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txHash?: string;
}
