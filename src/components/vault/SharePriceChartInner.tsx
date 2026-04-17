"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type LineData,
} from "lightweight-charts";
import type { HistoricalDataPoint } from "@/types";

type TooltipState = {
  x: number;
  y: number;
  date: string;
  value: number;
  flipLeft: boolean;
};

const TOOLTIP_WIDTH = 120;
const TOOLTIP_OFFSET = 12;

export default function SharePriceChartInner({
  data,
}: {
  data: HistoricalDataPoint[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 12,
        fontFamily: "inherit",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "rgba(255,255,255,0.15)", width: 1, style: 3 },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#3b82f6",
      crosshairMarkerBackgroundColor: "#3b82f6",
      priceFormat: {
        type: "custom",
        minMove: 0.0001,
        formatter: (v: number) => `$${v.toFixed(4)}`,
      },
    });

    const lineData: LineData<UTCTimestamp>[] = data.map((d) => ({
      time: d.timestamp as UTCTimestamp,
      value: d.sharePrice,
    }));
    series.setData(lineData);
    chart.timeScale().fitContent();

    const handleCrosshairMove: Parameters<typeof chart.subscribeCrosshairMove>[0] = (param) => {
      const width = container.clientWidth;
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > 260
      ) {
        setTooltip(null);
        return;
      }
      const point = param.seriesData.get(series) as LineData<UTCTimestamp> | undefined;
      if (!point) {
        setTooltip(null);
        return;
      }
      const date = new Date((point.time as number) * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      );
      setTooltip({
        x: param.point.x,
        y: param.point.y,
        date,
        value: point.value,
        flipLeft: param.point.x + TOOLTIP_OFFSET + TOOLTIP_WIDTH > width,
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="relative h-[260px] w-full">
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm whitespace-nowrap"
          style={{
            left: tooltip.flipLeft
              ? tooltip.x - TOOLTIP_OFFSET
              : tooltip.x + TOOLTIP_OFFSET,
            top: tooltip.y,
            transform: `translate(${tooltip.flipLeft ? "-100%" : "0"}, -50%)`,
          }}
        >
          <p className="text-gray-400">{tooltip.date}</p>
          <p className="text-white font-medium">${tooltip.value.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}
