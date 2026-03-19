import type { VaultApiData, HistoricalDataPoint, VaultAllocation } from "@/types";

const MORPHO_API = "https://blue-api.morpho.org/graphql";

async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Morpho API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${json.errors[0]?.message}`);
  }

  return json.data;
}

export async function fetchVaultData(vaultAddress: string): Promise<VaultApiData> {
  const query = `
    query VaultData($address: String!, $chainId: Int!) {
      vaultV2ByAddress(address: $address, chainId: $chainId) {
        address
        name
        symbol
        totalAssetsUsd
        totalAssets
        liquidityUsd
        liquidity
        avgNetApy
        netApy
        apy
        asset {
          address
          symbol
          decimals
          priceUsd
        }
        curators {
          items {
            name
          }
        }
      }
    }
  `;

  const data = await gqlFetch<{
    vaultV2ByAddress: {
      address: string;
      name: string;
      symbol: string;
      totalAssetsUsd: number;
      totalAssets: string;
      liquidityUsd: number;
      liquidity: string;
      avgNetApy: number;
      netApy: number;
      apy: number;
      asset: {
        address: string;
        symbol: string;
        decimals: number;
        priceUsd: number;
      };
      curators: {
        items: Array<{ name: string }>;
      };
    };
  }>(query, { address: vaultAddress, chainId: 1 });

  const vault = data.vaultV2ByAddress;
  return {
    address: vault.address,
    name: vault.name,
    symbol: vault.symbol,
    totalAssetsUsd: vault.totalAssetsUsd,
    totalAssets: vault.totalAssets,
    liquidity: vault.liquidity,
    liquidityUsd: vault.liquidityUsd,
    avgNetApy: vault.avgNetApy ?? vault.netApy ?? vault.apy ?? 0,
    curator: vault.curators?.items?.[0] ?? null,
    asset: vault.asset,
  };
}

export async function fetchVaultHistory(vaultAddress: string): Promise<HistoricalDataPoint[]> {
  const query = `
    query VaultHistory($address: String!, $chainId: Int!) {
      vaultV2ByAddress(address: $address, chainId: $chainId) {
        historicalState {
          sharePrice(options: { interval: DAY }) {
            x
            y
          }
          avgNetApy(options: { interval: DAY }) {
            x
            y
          }
        }
      }
    }
  `;

  const data = await gqlFetch<{
    vaultV2ByAddress: {
      historicalState: {
        sharePrice: Array<{ x: number; y: number }>;
        avgNetApy: Array<{ x: number; y: number }>;
      };
    };
  }>(query, { address: vaultAddress, chainId: 1 });

  const sharePrices = data.vaultV2ByAddress?.historicalState?.sharePrice ?? [];
  const apys = data.vaultV2ByAddress?.historicalState?.avgNetApy ?? [];

  // Build a map of timestamp -> apy for joining
  const apyMap = new Map(apys.map((p) => [p.x, p.y]));

  return sharePrices
    .map((point) => ({
      timestamp: point.x,
      date: new Date(point.x * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sharePrice: point.y,
      apy: apyMap.get(point.x) ?? 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Fetch the vault's market allocations (which Morpho Blue markets it lends to).
// The `caps` field contains each market/adapter the vault is configured to supply into,
// along with the current `allocation` (amount deposited, in asset decimals).
// Cap data is a union: MarketV1CapData has the underlying market pair,
// AdapterCapData wraps another vault or market via an adapter contract.
export async function fetchVaultAllocations(vaultAddress: string): Promise<VaultAllocation[]> {
  const query = `
    query VaultAllocations($address: String!, $chainId: Int!) {
      vaultV2ByAddress(address: $address, chainId: $chainId) {
        totalAssets
        asset {
          decimals
          priceUsd
        }
        caps {
          items {
            type
            allocation
            data {
              ... on MarketV1CapData {
                market {
                  collateralAsset { symbol }
                  loanAsset { symbol }
                  lltv
                }
              }
              ... on AdapterCapData {
                adapter {
                  type
                  assets
                  assetsUsd
                }
              }
            }
          }
        }
      }
    }
  `;

  type CapItem = {
    type: string;
    allocation: number;
    data: {
      market?: {
        collateralAsset: { symbol: string };
        loanAsset: { symbol: string };
        lltv: string;
      };
      adapter?: {
        type: string;
        assets: string;
        assetsUsd: number | null;
      };
    };
  };

  const data = await gqlFetch<{
    vaultV2ByAddress: {
      totalAssets: number;
      asset: { decimals: number; priceUsd: number };
      caps: { items: CapItem[] };
    };
  }>(query, { address: vaultAddress, chainId: 1 });

  const vault = data.vaultV2ByAddress;
  const decimals = vault.asset.decimals;
  const priceUsd = vault.asset.priceUsd;

  return vault.caps.items
    .filter((cap) => cap.allocation > 0)
    .map((cap) => {
      const allocationUsd = (cap.allocation / 10 ** decimals) * priceUsd;

      // Build a human-readable label from the cap's union type
      let label: string;
      if (cap.data.market) {
        const lltv = Number(cap.data.market.lltv) / 1e18;
        label = `${cap.data.market.collateralAsset.symbol} / ${cap.data.market.loanAsset.symbol} (${(lltv * 100).toFixed(0)}% LLTV)`;
      } else if (cap.data.adapter) {
        const adapterType = cap.data.adapter.type;
        label = adapterType === "MetaMorpho" ? "MetaMorpho Sub-Vault" : `${adapterType} Adapter`;
      } else {
        label = cap.type;
      }

      return {
        type: cap.type,
        allocation: cap.allocation,
        allocationUsd,
        label,
      };
    })
    .sort((a, b) => b.allocation - a.allocation);
}
