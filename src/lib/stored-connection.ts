import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/config/wagmi";
import type { Address } from "viem";

export type StoredConnection =
  | { hasStoredConnection: true; address?: Address }
  | { hasStoredConnection: false; address?: undefined };

export async function getStoredConnection(): Promise<StoredConnection> {
  const cookie = (await headers()).get("cookie") ?? undefined;
  const state = cookieToInitialState(config, cookie);
  if (!state?.current) return { hasStoredConnection: false };
  const connection = state.connections?.get(state.current);
  const address = connection?.accounts?.[0];
  return { hasStoredConnection: true, address };
}
