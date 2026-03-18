import type { VaultApiData, HistoricalDataPoint } from "@/types";

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
      vaultByAddress(address: $address, chainId: $chainId) {
        address
        name
        symbol
        state {
          totalAssetsUsd
          totalAssets
          liquidity
          liquidityUsd
          netApy
          apy
        }
        asset {
          address
          symbol
          decimals
          priceUsd
        }
        metadata {
          curators {
            name
          }
        }
      }
    }
  `;

  const data = await gqlFetch<{
    vaultByAddress: {
      address: string;
      name: string;
      symbol: string;
      state: {
        totalAssetsUsd: number;
        totalAssets: string;
        liquidity: string;
        liquidityUsd: number;
        netApy: number;
        apy: number;
      };
      asset: {
        address: string;
        symbol: string;
        decimals: number;
        priceUsd: number;
      };
      metadata: {
        curators: Array<{ name: string }>;
      };
    };
  }>(query, { address: vaultAddress, chainId: 1 });

  const vault = data.vaultByAddress;
  return {
    address: vault.address,
    name: vault.name,
    symbol: vault.symbol,
    totalAssetsUsd: vault.state.totalAssetsUsd,
    totalAssets: vault.state.totalAssets,
    liquidity: vault.state.liquidity,
    liquidityUsd: vault.state.liquidityUsd,
    avgNetApy: vault.state.netApy ?? vault.state.apy ?? 0,
    curator: vault.metadata?.curators?.[0] ?? null,
    asset: vault.asset,
  };
}

export async function fetchVaultHistory(vaultAddress: string): Promise<HistoricalDataPoint[]> {
  const query = `
    query VaultHistory($address: String!, $chainId: Int!) {
      vaultByAddress(address: $address, chainId: $chainId) {
        historicalState {
          totalAssets
          totalSupply
          apy
          timestamp
        }
      }
    }
  `;

  const data = await gqlFetch<{
    vaultByAddress: {
      historicalState: {
        all: Array<{
          totalAssets: string;
          totalSupply: string;
          apy: number;
          timestamp: number;
        }>;
      };
    };
  }>(query, { address: vaultAddress, chainId: 1 });

  const history = data.vaultByAddress?.historicalState?.all ?? data.vaultByAddress?.historicalState ?? [];
  const items = Array.isArray(history) ? history : [];

  return items.map((point) => {
    const totalAssets = Number(point.totalAssets) / 1e6; // USDC 6 decimals
    const totalSupply = Number(point.totalSupply) / 1e18; // Vault shares 18 decimals
    const sharePrice = totalSupply > 0 ? totalAssets / totalSupply : 1;

    return {
      timestamp: point.timestamp,
      date: new Date(point.timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      totalAssets,
      totalSupply,
      sharePrice,
      apy: point.apy ?? 0,
    };
  });
}
