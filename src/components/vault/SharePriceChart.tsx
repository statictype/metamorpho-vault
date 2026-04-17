"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useVaultHistory } from "@/hooks/useVaultHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import type { HistoricalDataPoint } from "@/types";

const SharePriceChartInner = dynamic(
  () => import("./SharePriceChartInner"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[260px] w-full" />,
  }
);

const TIME_RANGES = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  ALL: Infinity,
} as const;

type TimeRange = keyof typeof TIME_RANGES;

type Props = {
  initialData: HistoricalDataPoint[];
  initialDataUpdatedAt: number;
};

export function SharePriceChart({ initialData, initialDataUpdatedAt }: Props) {
  const { data, isError } = useVaultHistory({ initialData, initialDataUpdatedAt });
  const [range, setRange] = useState<TimeRange>("3M");

  const days = TIME_RANGES[range];
  const cutoff = data?.length && range !== "ALL"
    ? data[data.length - 1].timestamp - days * 86_400
    : -Infinity;
  const filteredData = data?.filter((d) => d.timestamp >= cutoff) ?? [];

  if (isError || !data?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Share Price</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Data unavailable
        </div>
      </div>
    );
  }

  const chartData = filteredData.length > 0 ? filteredData : data;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">Share Price</h2>
        <div className="flex gap-1">
          {(Object.keys(TIME_RANGES) as TimeRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                range === key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <SharePriceChartInner data={chartData} />
    </div>
  );
}
