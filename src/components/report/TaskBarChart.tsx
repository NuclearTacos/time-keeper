"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TaskBarRow } from "@/lib/reportTransforms";

interface Props {
  data: TaskBarRow[];
  colorMap: Map<string, string>;
}

const TRUNCATE = 22;

function truncate(s: string) {
  return s.length > TRUNCATE ? s.slice(0, TRUNCATE - 1) + "…" : s;
}

export function TaskBarChart({ data, colorMap }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions in this period.</p>;
  }

  const height = Math.max(160, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 64, bottom: 0, left: 4 }}
      >
        <XAxis type="number" dataKey="minutes" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tickFormatter={truncate}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(_value: number, _name: string, props: { payload?: { durationLabel?: string } }) => [
            props.payload?.durationLabel ?? `${_value} min`,
            "Duration",
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="minutes" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell
              key={entry.taskId}
              fill={colorMap.get(entry.taskId) ?? "#6366f1"}
            />
          ))}
          <LabelList
            dataKey="durationLabel"
            position="right"
            style={{ fill: "#6b7280", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
