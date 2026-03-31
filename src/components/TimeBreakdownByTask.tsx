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

export function TimeBreakdownByTask({ entries }: { entries: Entry[] }) {
  const byTask = new Map<string, { name: string; tags: string[]; totalMs: number }>();

  for (const { session, task } of entries) {
    if (!task) continue;
    const endTime = session.endTime ?? Date.now();
    const duration = endTime - session.startTime;
    const existing = byTask.get(task._id);
    if (existing) {
      existing.totalMs += duration;
    } else {
      byTask.set(task._id, { name: task.name, tags: task.tags, totalMs: duration });
    }
  }

  const sorted = [...byTask.values()].sort((a, b) => b.totalMs - a.totalMs);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this period.</p>;
  }

  return (
    <ul className="divide-y">
      {sorted.map(({ name, tags, totalMs }) => (
        <li key={name} className="flex items-center justify-between gap-4 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            {tags.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {tags.map((t) => `#${t}`).join(" ")}
              </p>
            )}
          </div>
          <span className="shrink-0 font-mono text-sm tabular-nums">
            {formatDuration(totalMs)}
          </span>
        </li>
      ))}
    </ul>
  );
}
