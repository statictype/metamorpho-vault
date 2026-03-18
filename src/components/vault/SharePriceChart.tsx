"use client";

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

  const minPrice = Math.min(...data.map((d) => d.sharePrice));
  const maxPrice = Math.max(...data.map((d) => d.sharePrice));
  const padding = (maxPrice - minPrice) * 0.1 || 0.0001;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Share Price</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
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
