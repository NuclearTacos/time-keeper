export const TASK_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a78bfa", // purple-light
];

/** Assigns a stable color to each key by cycling through TASK_COLORS. */
export function buildColorMap(keys: string[]): Map<string, string> {
  const map = new Map<string, string>();
  keys.forEach((key, i) => {
    map.set(key, TASK_COLORS[i % TASK_COLORS.length]);
  });
  return map;
}

/** Full Tailwind class strings for heatmap intensity (must be literal for Tailwind to include them). */
export const HEATMAP_COLORS = [
  "bg-muted",
  "bg-emerald-100 dark:bg-emerald-900/40",
  "bg-emerald-200 dark:bg-emerald-800/50",
  "bg-emerald-300 dark:bg-emerald-700/60",
  "bg-emerald-400 dark:bg-emerald-600/70",
  "bg-emerald-500 dark:bg-emerald-500",
] as const;

/** Maps total hours worked to a HEATMAP_COLORS index (0–5). */
export function heatmapLevel(totalHours: number): number {
  if (totalHours <= 0) return 0;
  if (totalHours < 1) return 1;
  if (totalHours < 2) return 2;
  if (totalHours < 4) return 3;
  if (totalHours < 6) return 4;
  return 5;
}
