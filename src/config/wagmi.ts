import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet } from "wagmi/chains";

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

export const config = getDefaultConfig({
  appName: "MetaMorpho Vault",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(rpcUrl),
  },
  ssr: true,
});
