import { describe, it, expect } from "vitest";
import {
  parseUsdcInput,
  formatUsdc,
  formatUsd,
  formatPercent,
  shortenAddress,
} from "@/lib/format";

describe("parseUsdcInput", () => {
  it("parses whole numbers", () => {
    expect(parseUsdcInput("100")).toBe(100_000000n);
  });

  it("parses decimal amounts", () => {
    expect(parseUsdcInput("1.5")).toBe(1_500000n);
    expect(parseUsdcInput("0.01")).toBe(10000n);
  });

  it("truncates beyond 6 decimal places", () => {
    expect(parseUsdcInput("1.1234567")).toBe(1_123456n);
  });

  it("pads short decimals to 6 places", () => {
    expect(parseUsdcInput("1.1")).toBe(1_100000n);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseUsdcInput("")).toBe(null);
    expect(parseUsdcInput("abc")).toBe(null);
    expect(parseUsdcInput("-5")).toBe(null);
  });

  it("handles zero", () => {
    expect(parseUsdcInput("0")).toBe(0n);
  });
});

describe("formatUsdc", () => {
  it("formats with 2 decimal places", () => {
    expect(formatUsdc(1_000000n)).toBe("1.00");
    expect(formatUsdc(1_500000n)).toBe("1.50");
  });

  it("formats large amounts with commas", () => {
    expect(formatUsdc(1_000_000_000000n)).toBe("1,000,000.00");
  });

  it("formats zero", () => {
    expect(formatUsdc(0n)).toBe("0.00");
  });
});

describe("formatUsd", () => {
  it("formats as USD currency", () => {
    expect(formatUsd(1000)).toBe("$1,000");
    expect(formatUsd(1234.56)).toBe("$1,234.56");
  });
});

describe("formatPercent", () => {
  it("converts decimal to percentage", () => {
    expect(formatPercent(0.05)).toBe("5.00%");
    expect(formatPercent(0.1234)).toBe("12.34%");
  });
});

describe("shortenAddress", () => {
  it("shortens an Ethereum address", () => {
    expect(shortenAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).toBe(
      "0xf39F...2266"
    );
  });
});
