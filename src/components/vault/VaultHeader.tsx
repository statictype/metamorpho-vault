"use client";

import { VAULT_ADDRESS } from "@/config/contracts";
import { shortenAddress } from "@/lib/format";
import { useVaultApi } from "@/hooks/useVaultApi";
import { Skeleton } from "@/components/ui/Skeleton";

export function VaultHeader() {
  const { data, isLoading } = useVaultApi();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-400">
          $
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-48 mb-1" />
          ) : (
            <h1 className="text-2xl font-bold text-white">
              {data?.name || "MetaMorpho Vault"}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <a
              href={`https://etherscan.io/address/${VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-300 font-mono"
            >
              {shortenAddress(VAULT_ADDRESS)}
            </a>
            {data?.curator && (
              <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                {data.curator.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
