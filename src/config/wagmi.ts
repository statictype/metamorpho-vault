import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { anvil, mainnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { cookieStorage, createStorage, http } from "wagmi";

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

const isLocalRpc = /^(https?:\/\/)?(127\.0\.0\.1|localhost)/.test(rpcUrl);
const chain = isLocalRpc ? anvil : mainnet;

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [chain];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [chain.id]: http(rpcUrl),
  },
});

export const config = wagmiAdapter.wagmiConfig;
