import { getVaultAllocations } from "@/lib/morpho-api.server";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultAllocations } from "./VaultAllocations";

export async function VaultAllocationsServer() {
  const { data, fetchedAt } = await getVaultAllocations(VAULT_ADDRESS);
  return <VaultAllocations initialData={data} initialDataUpdatedAt={fetchedAt} />;
}
