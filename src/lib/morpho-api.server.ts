import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  fetchVaultData,
  fetchVaultHistory,
  fetchVaultAllocations,
} from "./morpho-api";

export async function getVaultSummary(address: string) {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary", `vault-${address.toLowerCase()}`);
  return fetchVaultData(address);
}

export async function getVaultHistory(address: string) {
  "use cache";
  cacheLife({ revalidate: 300, stale: 600, expire: 3600 });
  cacheTag("vault-history", `vault-${address.toLowerCase()}`);
  return fetchVaultHistory(address);
}

export async function getVaultAllocations(address: string) {
  "use cache";
  cacheLife({ revalidate: 60, stale: 120, expire: 600 });
  cacheTag("vault-allocations", `vault-${address.toLowerCase()}`);
  return fetchVaultAllocations(address);
}
