import { getVaultHistory } from "@/lib/morpho-api.server";
import { VAULT_ADDRESS } from "@/config/contracts";
import { SharePriceChart } from "./SharePriceChart";

export async function SharePriceChartServer() {
  const { data, fetchedAt } = await getVaultHistory(VAULT_ADDRESS);
  return <SharePriceChart initialData={data} initialDataUpdatedAt={fetchedAt} />;
}
