import { getVaultSummary } from "@/lib/morpho-api.server";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultHeader } from "./VaultHeader";

export async function VaultHeaderServer() {
  const { data } = await getVaultSummary(VAULT_ADDRESS);
  return <VaultHeader name={data.name} curator={data.curator} />;
}
