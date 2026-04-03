"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TASK_COLORS } from "@/lib/reportColors";
import type { TagDonutRow } from "@/lib/reportTransforms";

interface Props {
  data: TagDonutRow[];
  totalDurationLabel: string;
}

export function TagDonutChart({ data, totalDurationLabel }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No tagged sessions in this period.</p>;
  }

  return (
    <div>
      <div className="relative flex justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="minutes"
              nameKey="tag"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={entry.tag} fill={TASK_COLORS[i % TASK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(_: number, name: string) => [
                data.find((d) => d.tag === name)?.durationLabel ?? "",
                `#${name}`,
              ]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-medium text-center leading-tight text-muted-foreground">
            {totalDurationLabel}
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {data.map((entry, i) => (
          <li key={entry.tag} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className="size-2 rounded-full inline-block shrink-0"
              style={{ background: TASK_COLORS[i % TASK_COLORS.length] }}
            />
            #{entry.tag}
          </li>
        ))}
      </ul>
    </div>
  );
}
