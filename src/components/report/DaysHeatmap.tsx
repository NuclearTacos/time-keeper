"use client";

import { cn } from "@/lib/utils";
import { HEATMAP_COLORS, heatmapLevel } from "@/lib/reportColors";
import type { HeatmapDay } from "@/lib/reportTransforms";

interface Props {
  days: HeatmapDay[];
  multiRow?: boolean;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function DaysHeatmap({ days, multiRow = false }: Props) {
  if (days.length === 0) return null;

  // For multi-row (sprint), compute leading empty cells to align first day to Monday
  let leadingEmpty = 0;
  if (multiRow && days.length > 0) {
    const firstDate = new Date(days[0].dateStr + "T12:00:00");
    const dow = firstDate.getDay(); // 0=Sun
    leadingEmpty = dow === 0 ? 6 : dow - 1;
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {DAY_LABELS.map((d, i) => (
        <div key={i} className="text-center text-xs text-muted-foreground pb-0.5">
          {d}
        </div>
      ))}
      {Array.from({ length: leadingEmpty }).map((_, i) => (
        <div key={`empty-${i}`} />
      ))}
      {days.map(({ dateStr, totalHours, durationLabel }) => {
        const level = heatmapLevel(totalHours);
        const colorClass = HEATMAP_COLORS[level];
        const dayNum = new Date(dateStr + "T12:00:00").getDate();
        return (
          <div
            key={dateStr}
            title={`${dateStr}: ${durationLabel}`}
            className={cn(
              "rounded flex flex-col items-center justify-center aspect-square text-xs gap-0",
              colorClass
            )}
          >
            <span className="font-medium leading-none">{dayNum}</span>
            {totalHours > 0 && (
              <span className="opacity-60 leading-none" style={{ fontSize: 9 }}>
                {Math.round(totalHours * 10) / 10}h
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
