"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useVaultHistory } from "@/hooks/useVaultHistory";
import { Skeleton } from "@/components/ui/Skeleton";

const TIME_RANGES = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  ALL: Infinity,
} as const;

type TimeRange = keyof typeof TIME_RANGES;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-medium">
        ${payload[0].value.toFixed(6)}
      </p>
    </div>
  );
}

export function SharePriceChart() {
  const { data, isLoading, isError } = useVaultHistory();
  const [range, setRange] = useState<TimeRange>("3M");

  const days = TIME_RANGES[range];
  const cutoff = data?.length && range !== "ALL"
    ? data[data.length - 1].timestamp - days * 86_400
    : -Infinity;
  const filteredData = data?.filter((d) => d.timestamp >= cutoff) ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Share Price</h3>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Share Price</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Data unavailable
        </div>
      </div>
    );
  }

  const chartData = filteredData.length > 0 ? filteredData : data;
  const minPrice = Math.min(...chartData.map((d) => d.sharePrice));
  const maxPrice = Math.max(...chartData.map((d) => d.sharePrice));
  const padding = (maxPrice - minPrice) * 0.1 || 0.0001;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">Share Price</h3>
        <div className="flex gap-1">
          {(Object.keys(TIME_RANGES) as TimeRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                range === key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(4)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="sharePrice"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
