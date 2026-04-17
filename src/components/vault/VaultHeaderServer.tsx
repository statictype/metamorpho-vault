import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultHeader } from "./VaultHeader";

export async function VaultHeaderServer() {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary");
  const data = await fetchVaultData(VAULT_ADDRESS);
  return <VaultHeader name={data.name} curator={data.curator} />;
}
