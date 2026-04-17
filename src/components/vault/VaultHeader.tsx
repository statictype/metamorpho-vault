import type { ReactNode } from "react";
import { VAULT_ADDRESS, VAULT_NAME } from "@/config/contracts";
import { shortenAddress } from "@/lib/format";

type Props = {
  curatorSlot?: ReactNode;
};

export function VaultHeader({ curatorSlot }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-400">
          $
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{VAULT_NAME}</h1>
          <div className="flex items-center gap-2">
            <a
              href={`https://etherscan.io/address/${VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              {shortenAddress(VAULT_ADDRESS)}
            </a>
            {curatorSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
