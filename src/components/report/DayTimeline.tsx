"use client";

import { Fragment, useState } from "react";
import type { TimelineSession } from "@/lib/reportTransforms";
import { cn } from "@/lib/utils";

interface Props {
  sessions: TimelineSession[];
  colorMap: Map<string, string>;
  dayStart: number;
  hierarchy: Map<string, string>; // tag → supertag
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

export function DayTimeline({ sessions, colorMap, dayStart, hierarchy }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions today.</p>;
  }

  const startHours = sessions.map((s) => (s.startMs - dayStart) / 3_600_000);
  const endHours = sessions.map((s) => (s.endMs - dayStart) / 3_600_000);
  const HOUR_START = Math.max(0, Math.floor(Math.min(...startHours)) - 1);
  const HOUR_END = Math.min(24, Math.ceil(Math.max(...endHours)) + 1);
  const totalHours = HOUR_END - HOUR_START;

  const tagSet = new Set<string>();
  let hasUntagged = false;
  for (const s of sessions) {
    if (s.tags.length === 0) hasUntagged = true;
    else for (const tag of s.tags) tagSet.add(tag);
  }
  const tagLanes = [...tagSet].sort();
  if (hasUntagged) tagLanes.push("(untagged)");

  const byTag = new Map<string, TimelineSession[]>();
  for (const lane of tagLanes) byTag.set(lane, []);
  for (const s of sessions) {
    if (s.tags.length === 0) byTag.get("(untagged)")!.push(s);
    else for (const tag of s.tags) byTag.get(tag)?.push(s);
  }

  function toggleExpand(tag: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  // Returns subtags (rawTags that resolve to this supertag), or null if none
  function getSubtags(tag: string, tagSessions: TimelineSession[]): string[] | null {
    const subtags = new Set<string>();
    for (const s of tagSessions) {
      for (const raw of s.rawTags) {
        if ((hierarchy.get(raw) ?? raw) === tag && raw !== tag) subtags.add(raw);
      }
    }
    return subtags.size > 0 ? [...subtags].sort() : null;
  }

  // Returns unique tasks in these sessions, sorted by name
  function getSubtasks(tagSessions: TimelineSession[]): Array<{ taskId: string; taskName: string }> {
    const seen = new Map<string, string>();
    for (const s of tagSessions) seen.set(s.taskId, s.taskName);
    return [...seen.entries()]
      .map(([taskId, taskName]) => ({ taskId, taskName }))
      .sort((a, b) => a.taskName.localeCompare(b.taskName));
  }

  function renderBlocks(
    trackSessions: TimelineSession[],
    rowHeight: number,
  ) {
    const laned = assignLanes(trackSessions);
    return laned.map((s) => {
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
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, top, background: color, minWidth: 4, opacity: 0.85 }}
        >
          <div
            className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block bg-popover text-popover-foreground rounded px-2 py-1 shadow-md border border-border max-w-xs break-words"
            style={{ fontSize: 11 }}
          >
            {s.taskName} · {s.durationLabel}
          </div>
        </div>
      );
    });
  }

  function renderSubRow(
    label: string,
    subSessions: TimelineSession[],
  ) {
    const laned = assignLanes(subSessions);
    const maxLane = laned.length > 0 ? Math.max(...laned.map((s) => s.lane)) : 0;
    const rowHeight = (maxLane + 1) * 28 + 4;
    return (
      <Fragment key={label}>
        <div
          className="text-muted-foreground/60 whitespace-nowrap pt-1 text-right self-start"
          style={{ fontSize: 10, paddingLeft: 8 }}
        >
          {label}
        </div>
        <div className="relative bg-muted/20 rounded mb-1" style={{ height: rowHeight }}>
          {renderBlocks(subSessions, rowHeight)}
        </div>
      </Fragment>
    );
  }

  return (
    <div
      className="select-none text-xs"
      style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "0 6px" }}
    >
      {/* Hour ruler */}
      <div />
      <div className="flex mb-1">
        {Array.from({ length: totalHours + 1 }, (_, i) => (
          <span key={i} className="flex-1 text-muted-foreground" style={{ minWidth: 0 }}>
            {fmtHour(HOUR_START + i)}
          </span>
        ))}
      </div>

      {tagLanes.map((tag) => {
        const tagSessions = byTag.get(tag)!;
        const laned = assignLanes(tagSessions);
        const maxLane = laned.length > 0 ? Math.max(...laned.map((s) => s.lane)) : 0;
        const rowHeight = (maxLane + 1) * 28 + 4;
        const isExpanded = expanded.has(tag);

        const subtags = tag !== "(untagged)" ? getSubtags(tag, tagSessions) : null;
        const subtasks = getSubtasks(tagSessions);
        const canExpand = subtags !== null || subtasks.length > 1 || tag === "(untagged)";

        return (
          <Fragment key={tag}>
            {/* Label */}
            <button
              onClick={() => canExpand && toggleExpand(tag)}
              disabled={!canExpand}
              className={cn(
                "text-muted-foreground whitespace-nowrap pt-1 text-right self-start flex items-center justify-end gap-1",
                canExpand && "hover:text-foreground transition-colors cursor-pointer"
              )}
              style={{ fontSize: 11 }}
            >
              {canExpand && (
                <span className="opacity-50" style={{ fontSize: 9 }}>
                  {isExpanded ? "▾" : "▸"}
                </span>
              )}
              {tag === "(untagged)" ? tag : `#${tag}`}
            </button>

            {/* Track */}
            <div
              className={cn("relative bg-muted/30 rounded mb-1 transition-opacity", isExpanded && "opacity-20")}
              style={{ height: rowHeight }}
            >
              {renderBlocks(tagSessions, rowHeight)}
            </div>

            {/* Sub-rows when expanded */}
            {isExpanded && (
              subtags
                ? subtags.map((subtag) =>
                    renderSubRow(
                      `#${subtag}`,
                      tagSessions.filter((s) => s.rawTags.includes(subtag))
                    )
                  )
                : subtasks.map(({ taskId, taskName }) =>
                    renderSubRow(
                      taskName.length > 18 ? taskName.slice(0, 17) + "…" : taskName,
                      tagSessions.filter((s) => s.taskId === taskId)
                    )
                  )
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
