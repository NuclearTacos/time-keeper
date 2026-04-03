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

export function DayTimeline({ sessions, colorMap, dayStart }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions today.</p>;
  }

  const startHours = sessions.map((s) => (s.startMs - dayStart) / 3_600_000);
  const endHours = sessions.map((s) => (s.endMs - dayStart) / 3_600_000);
  const HOUR_START = Math.max(0, Math.floor(Math.min(...startHours)) - 1);
  const HOUR_END = Math.min(24, Math.ceil(Math.max(...endHours)) + 1);
  const totalHours = HOUR_END - HOUR_START;

  const laned = assignLanes(sessions);
  const maxLane = Math.max(...laned.map((s) => s.lane));
  const bodyHeight = (maxLane + 1) * 32 + 8;

  return (
    <div className="select-none">
      {/* Hour ruler */}
      <div className="flex text-xs text-muted-foreground mb-1 px-0">
        {Array.from({ length: totalHours + 1 }, (_, i) => (
          <span key={i} className="flex-1" style={{ minWidth: 0 }}>
            {fmtHour(HOUR_START + i)}
          </span>
        ))}
      </div>
      {/* Session tracks */}
      <div className="relative w-full bg-muted/30 rounded" style={{ height: bodyHeight }}>
        {laned.map((s) => {
          const rawStart = (s.startMs - dayStart) / 3_600_000;
          const rawEnd = (s.endMs - dayStart) / 3_600_000;
          const clampedStart = Math.max(rawStart, HOUR_START);
          const clampedEnd = Math.min(rawEnd, HOUR_END);
          const leftPct = ((clampedStart - HOUR_START) / totalHours) * 100;
          const widthPct = Math.max(0.3, ((clampedEnd - clampedStart) / totalHours) * 100);
          const top = s.lane * 32 + 4;
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
              }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-md whitespace-nowrap border border-border">
                {s.taskName} · {s.durationLabel}
              </div>
              {/* Inline label if wide enough */}
              <span
                className="absolute inset-0 flex items-center px-1.5 text-white text-xs font-medium truncate"
                style={{ fontSize: 10 }}
              >
                {s.taskName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
