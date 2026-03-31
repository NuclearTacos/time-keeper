"use client";

import { formatDuration } from "@/lib/formatDuration";

type Session = {
  startTime: number;
  endTime?: number;
};

type Task = {
  _id: string;
  name: string;
  tags: string[];
};

type Entry = {
  session: Session;
  task: Task | null;
};

export function TimeBreakdownByTag({ entries }: { entries: Entry[] }) {
  const byTag = new Map<string, number>();

  for (const { session, task } of entries) {
    if (!task || task.tags.length === 0) continue;
    const endTime = session.endTime ?? Date.now();
    const duration = endTime - session.startTime;
    for (const tag of task.tags) {
      byTag.set(tag, (byTag.get(tag) ?? 0) + duration);
    }
  }

  const sorted = [...byTag.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No tagged tasks in this period.</p>;
  }

  return (
    <ul className="divide-y">
      {sorted.map(([tag, totalMs]) => (
        <li key={tag} className="flex items-center justify-between gap-4 py-2">
          <span className="text-sm">#{tag}</span>
          <span className="font-mono text-sm tabular-nums">{formatDuration(totalMs)}</span>
        </li>
      ))}
    </ul>
  );
}
