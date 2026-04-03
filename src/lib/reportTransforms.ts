import { formatDuration } from "./formatDuration";

export type SessionEntry = {
  session: {
    _id: string;
    startTime: number;
    endTime?: number;
    taskId: string;
  };
  task: {
    _id: string;
    name: string;
    tags: string[];
  } | null;
};

export type TaskBarRow = {
  taskId: string;
  name: string;
  minutes: number;
  durationLabel: string;
};

export type TagDonutRow = {
  tag: string;
  minutes: number;
  durationLabel: string;
};

export type TimelineSession = {
  sessionId: string;
  taskId: string;
  taskName: string;
  tags: string[];     // resolved (supertags applied)
  rawTags: string[];  // original tags before hierarchy resolution
  startMs: number;
  endMs: number;
  durationLabel: string;
};

export type HeatmapDay = {
  dateStr: string;
  totalHours: number;
  durationLabel: string;
};

export function buildTaskBarData(entries: SessionEntry[], now = Date.now()): TaskBarRow[] {
  const map = new Map<string, { name: string; totalMs: number }>();
  for (const { session, task } of entries) {
    if (!task) continue;
    const end = session.endTime ?? now;
    const ms = Math.max(0, end - session.startTime);
    const existing = map.get(task._id);
    if (existing) {
      existing.totalMs += ms;
    } else {
      map.set(task._id, { name: task.name, totalMs: ms });
    }
  }
  return [...map.entries()]
    .map(([taskId, { name, totalMs }]) => ({
      taskId,
      name,
      minutes: Math.round(totalMs / 60_000),
      durationLabel: formatDuration(totalMs),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

function resolveTag(tag: string, hierarchy: Map<string, string>): string {
  return hierarchy.get(tag) ?? tag;
}

export function buildTagDonutData(
  entries: SessionEntry[],
  now = Date.now(),
  hierarchy: Map<string, string> = new Map()
): TagDonutRow[] {
  const map = new Map<string, number>();
  for (const { session, task } of entries) {
    if (!task || task.tags.length === 0) continue;
    const end = session.endTime ?? now;
    const ms = Math.max(0, end - session.startTime);
    const resolved = [...new Set(task.tags.map((t) => resolveTag(t, hierarchy)))];
    for (const tag of resolved) {
      map.set(tag, (map.get(tag) ?? 0) + ms);
    }
  }
  return [...map.entries()]
    .map(([tag, totalMs]) => ({
      tag,
      minutes: Math.round(totalMs / 60_000),
      durationLabel: formatDuration(totalMs),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function buildTimelineData(
  entries: SessionEntry[],
  dayStart: number,
  dayEnd: number,
  now = Date.now(),
  hierarchy: Map<string, string> = new Map()
): TimelineSession[] {
  return entries
    .filter(({ task }) => task !== null)
    .map(({ session, task }) => {
      const end = session.endTime ?? now;
      const resolved = [...new Set(task!.tags.map((t) => resolveTag(t, hierarchy)))];
      return {
        sessionId: session._id,
        taskId: task!._id,
        taskName: task!.name,
        tags: resolved,
        rawTags: task!.tags,
        startMs: session.startTime,
        endMs: end,
        durationLabel: formatDuration(end - session.startTime),
      };
    })
    .filter(({ startMs, endMs }) => startMs < dayEnd && endMs > dayStart);
}

export function buildHeatmapData(
  entries: SessionEntry[],
  fromMs: number,
  toMs: number,
  now = Date.now()
): HeatmapDay[] {
  const dayMap = new Map<string, number>();
  for (const { session, task } of entries) {
    if (!task) continue;
    const end = session.endTime ?? now;
    const ms = Math.max(0, end - session.startTime);
    const dateStr = new Date(session.startTime).toLocaleDateString("en-CA");
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + ms);
  }

  const result: HeatmapDay[] = [];
  const cursor = new Date(fromMs);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toMs);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const dateStr = cursor.toLocaleDateString("en-CA");
    const totalMs = dayMap.get(dateStr) ?? 0;
    result.push({
      dateStr,
      totalHours: totalMs / 3_600_000,
      durationLabel: totalMs > 0 ? formatDuration(totalMs) : "0h",
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function computeTotalMs(entries: SessionEntry[], now = Date.now()): number {
  return entries.reduce((sum, { session, task }) => {
    if (!task) return sum;
    const end = session.endTime ?? now;
    return sum + Math.max(0, end - session.startTime);
  }, 0);
}
