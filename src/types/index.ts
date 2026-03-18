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
  totalAssets: number;
  totalSupply: number;
  sharePrice: number;
  apy: number;
}

export interface UserPosition {
  shares: bigint;
  assets: bigint;
}

export type ToastType = "pending" | "success" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txHash?: string;
}
