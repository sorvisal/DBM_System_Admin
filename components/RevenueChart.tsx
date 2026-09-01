"use client";

import { useRef, useEffect, useState } from "react";
import type { RevenuePointDto } from "@/lib/types";
import { fmtMoney } from "@/components/ui";

interface RevenueChartProps {
  data: RevenuePointDto[];
  height?: number;
  className?: string;
}

export function RevenueChart({ data, height = 192, className = "" }: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxRevenue = Math.max(...data.map((p) => p.revenue), 1);
  const count = data.length;

  // Dynamic bar width: ensure each bar has enough room for its label
  const minBarWidth = 24;
  const totalNeeded = count * minBarWidth;
  const barWidth = containerWidth > 0 ? Math.max(Math.floor(containerWidth / count), minBarWidth) : minBarWidth;
  const isScrollable = totalNeeded > (containerWidth || 600);
  const rotateLabels = count >= 15;
  const showAllLabels = count <= 12;
  const showEveryNth = Math.ceil(count / Math.min(count, 10));

  return (
    <div ref={containerRef} className={className}>
      <div
        className={`flex items-end ${isScrollable ? "overflow-x-auto scrollbar-thin" : ""}`}
        style={{ height, gap: 1 }}
      >
        {data.map((p, i) => {
          const h = Math.max((p.revenue / maxRevenue) * (height - 24), 2);
          const shouldShowLabel = showAllLabels || i % showEveryNth === 0 || i === count - 1;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              style={{ width: barWidth }}
            >
              <div
                className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all duration-150 cursor-pointer hover:scale-y-105 origin-bottom"
                style={{ height: h, minHeight: 2 }}
                title={`${p.label}: ${fmtMoney(p.revenue)}`}
                role="img"
                aria-label={`${p.label}: ${fmtMoney(p.revenue)}`}
              />
              {shouldShowLabel && (
                <span
                  className={`text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight ${rotateLabels ? "rotate-[-35deg] origin-top" : ""}`}
                  style={
                    rotateLabels
                      ? { width: `${barWidth - 4}px`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                      : undefined
                  }
                >
                  {p.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {isScrollable && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center">
          Scroll to see all data points
        </p>
      )}
    </div>
  );
}
