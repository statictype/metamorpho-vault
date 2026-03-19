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
import type { HistoricalDataPoint } from "@/types";

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

export default function SharePriceChartInner({ data }: { data: HistoricalDataPoint[] }) {
  const minPrice = Math.min(...data.map((d) => d.sharePrice));
  const maxPrice = Math.max(...data.map((d) => d.sharePrice));
  const padding = (maxPrice - minPrice) * 0.1 || 0.0001;

  return (
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
  );
}
