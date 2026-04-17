"use client";

import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, networks, projectId } from "./wagmi";

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: projectId!,
  metadata: {
    name: "MetaMorpho Vault",
    description: "Deposit and withdraw USDC from the 3F x Steakhouse MetaMorpho vault",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: [],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
});
