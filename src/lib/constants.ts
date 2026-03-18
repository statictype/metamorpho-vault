export const CHAIN_ID = 1;

export const QUERY_KEYS = {
  vaultOnChain: ["vault", "onchain"] as const,
  userPosition: ["user", "position"] as const,
  allowance: ["user", "allowance"] as const,
  usdcBalance: ["user", "usdcBalance"] as const,
  vaultApi: ["vault", "api"] as const,
  vaultHistory: ["vault", "history"] as const,
  vaultAllocations: ["vault", "allocations"] as const,
} as const;
