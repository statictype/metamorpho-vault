import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultHeader } from "./VaultHeader";

export function VaultHeaderServer() {
  return (
    <VaultHeader
      curatorSlot={
        <Suspense fallback={null}>
          <VaultCurator />
        </Suspense>
      }
    />
  );
}

async function VaultCurator() {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary");
  const data = await fetchVaultData(VAULT_ADDRESS);
  if (!data.curator) return null;
  return (
    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
      {data.curator.name}
    </span>
  );
}
