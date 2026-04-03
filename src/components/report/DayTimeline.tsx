"use client";

import type { TimelineSession } from "@/lib/reportTransforms";

interface Props {
  sessions: TimelineSession[];
  colorMap: Map<string, string>;
  dayStart: number;
}

type LanedSession = TimelineSession & { lane: number };

function assignLanes(sessions: TimelineSession[]): LanedSession[] {
  const sorted = [...sessions].sort((a, b) => a.startMs - b.startMs);
  const laneEndTimes: number[] = [];
  return sorted.map((s) => {
    const lane = laneEndTimes.findIndex((end) => end <= s.startMs);
    const assignedLane = lane === -1 ? laneEndTimes.length : lane;
    laneEndTimes[assignedLane] = s.endMs;
    return { ...s, lane: assignedLane };
  });
}

function fmtHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

const LABEL_W = 64; // px — left column for tag labels

export function DayTimeline({ sessions, colorMap, dayStart }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions today.</p>;
  }

  // Determine visible hour range
  const startHours = sessions.map((s) => (s.startMs - dayStart) / 3_600_000);
  const endHours = sessions.map((s) => (s.endMs - dayStart) / 3_600_000);
  const HOUR_START = Math.max(0, Math.floor(Math.min(...startHours)) - 1);
  const HOUR_END = Math.min(24, Math.ceil(Math.max(...endHours)) + 1);
  const totalHours = HOUR_END - HOUR_START;

  // Build ordered tag lanes
  const tagSet = new Set<string>();
  let hasUntagged = false;
  for (const s of sessions) {
    if (s.tags.length === 0) {
      hasUntagged = true;
    } else {
      tagSet.add(s.tags[0]);
    }
  }
  const tagLanes = [...tagSet].sort();
  if (hasUntagged) tagLanes.push("(untagged)");

  // Group sessions by their first tag
  const byTag = new Map<string, TimelineSession[]>();
  for (const lane of tagLanes) byTag.set(lane, []);
  for (const s of sessions) {
    const key = s.tags.length > 0 ? s.tags[0] : "(untagged)";
    byTag.get(key)!.push(s);
  }

  return (
    <div className="select-none text-xs">
      {/* Hour ruler */}
      <div className="flex mb-1" style={{ paddingLeft: LABEL_W }}>
        {Array.from({ length: totalHours + 1 }, (_, i) => (
          <span key={i} className="flex-1 text-muted-foreground" style={{ minWidth: 0 }}>
            {fmtHour(HOUR_START + i)}
          </span>
        ))}
      </div>

      {/* Tag rows */}
      <div className="space-y-1">
        {tagLanes.map((tag) => {
          const tagSessions = byTag.get(tag)!;
          const laned = assignLanes(tagSessions);
          const maxLane = laned.length > 0 ? Math.max(...laned.map((s) => s.lane)) : 0;
          const rowHeight = (maxLane + 1) * 28 + 4;

          return (
            <div key={tag} className="flex items-start gap-1">
              {/* Label */}
              <div
                className="shrink-0 text-muted-foreground truncate pt-1 text-right"
                style={{ width: LABEL_W, fontSize: 11 }}
                title={tag === "(untagged)" ? tag : `#${tag}`}
              >
                {tag === "(untagged)" ? tag : `#${tag}`}
              </div>
              {/* Track */}
              <div
                className="relative flex-1 bg-muted/30 rounded"
                style={{ height: rowHeight }}
              >
                {laned.map((s) => {
                  const rawStart = (s.startMs - dayStart) / 3_600_000;
                  const rawEnd = (s.endMs - dayStart) / 3_600_000;
                  const clampedStart = Math.max(rawStart, HOUR_START);
                  const clampedEnd = Math.min(rawEnd, HOUR_END);
                  const leftPct = ((clampedStart - HOUR_START) / totalHours) * 100;
                  const widthPct = Math.max(0.4, ((clampedEnd - clampedStart) / totalHours) * 100);
                  const top = s.lane * 28 + 2;
                  const color = colorMap.get(s.taskId) ?? "#6366f1";

                  return (
                    <div
                      key={s.sessionId}
                      className="absolute h-6 rounded group cursor-default"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        top,
                        background: color,
                        minWidth: 4,
                        opacity: 0.85,
                      }}
                    >
                      <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block bg-popover text-popover-foreground rounded px-2 py-1 shadow-md whitespace-nowrap border border-border" style={{ fontSize: 11 }}>
                        {s.taskName} · {s.durationLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
