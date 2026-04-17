import { getVaultSummary } from "@/lib/morpho-api.server";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultStats } from "./VaultStats";

export async function VaultStatsServer() {
  const { data, fetchedAt } = await getVaultSummary(VAULT_ADDRESS);
  return <VaultStats initialData={data} initialDataUpdatedAt={fetchedAt} />;
}
