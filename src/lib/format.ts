import { formatUnits } from "viem";

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUsdc(value: bigint): string {
  const num = Number(formatUnits(value, 6));
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatUsdcRaw(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function parseUsdcInput(value: string): bigint | null {
  try {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return null;
    // Convert to 6 decimal bigint
    const parts = value.split(".");
    const decimals = parts[1] ? parts[1].slice(0, 6).padEnd(6, "0") : "000000";
    const whole = parts[0] || "0";
    return BigInt(whole + decimals);
  } catch {
    return null;
  }
}
