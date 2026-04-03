"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Session {
  _id: Id<"sessions">;
  startTime: number;
  endTime?: number;
}

interface Entry {
  session: Session;
  task: { name: string; tags: string[] } | null;
}

interface Props {
  entries: Entry[];
  onBump?: (
    key: string,
    label: string,
    deltaMin: number,
    adjacentPairs: Array<[string, string]>
  ) => void;
  lockedPairs?: Array<[string, string]>;
}

const BUMP_OPTIONS = [-5, -1, 1, 5];

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDurationMs(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function computeAdjacentPairs(entries: Entry[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  // entries are ordered ascending by startTime (from getSessionsInRange)
  const sorted = [...entries].sort((a, b) => a.session.startTime - b.session.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i].session;
    const b = sorted[i + 1].session;
    if (a.endTime !== undefined && a.endTime === b.startTime) {
      pairs.push([`${a._id}-end`, `${b._id}-start`]);
    }
  }
  return pairs;
}

function findLockedPartner(
  key: string,
  lockedPairs: Array<[string, string]>
): string | null {
  for (const [a, b] of lockedPairs) {
    if (a === key) return b;
    if (b === key) return a;
  }
  return null;
}

export function SessionList({ entries, onBump, lockedPairs = [] }: Props) {
  const adjustSessionTime = useMutation(api.sessions.adjustSessionTime);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions in this range.</p>;
  }

  const byDate = new Map<string, Entry[]>();
  for (const entry of entries) {
    const date = formatDate(entry.session.startTime);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(entry);
  }

  function handleBump(
    sessionId: Id<"sessions">,
    boundary: "start" | "end",
    display: number
  ) {
    // For start: +display means earlier (negate); for end: +display means later (keep)
    const deltaMinutes = boundary === "start" ? -display : display;
    adjustSessionTime({ sessionId, boundary, deltaMinutes });

    const key = `${sessionId}-${boundary}`;
    const adjacentPairs = computeAdjacentPairs(entries);

    // Fire paired adjustment if locked
    const partnerKey = findLockedPartner(key, lockedPairs);
    if (partnerKey) {
      const [partnerId, partnerBoundary] = partnerKey.split("-") as [string, "start" | "end"];
      const partnerDelta = partnerBoundary === "start" ? -display : display;
      adjustSessionTime({
        sessionId: partnerId as Id<"sessions">,
        boundary: partnerBoundary,
        deltaMinutes: partnerDelta,
      });
    }

    onBump?.(key, boundary, display, adjacentPairs);
  }

  return (
    <div className="space-y-4">
      {[...byDate.entries()].map(([date, dayEntries]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{date}</p>
          <ul className="divide-y">
            {dayEntries.map(({ session, task }) => {
              const duration = session.endTime
                ? formatDurationMs(session.endTime - session.startTime)
                : null;
              return (
                <li key={session._id} className="py-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{task?.name ?? "Unknown task"}</p>
                    {duration && (
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{duration}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">start</p>
                      <p className="text-xs tabular-nums">{formatTime(session.startTime)}</p>
                      <div className="flex gap-1">
                        {BUMP_OPTIONS.map((d) => (
                          <button
                            key={d}
                            onClick={() => handleBump(session._id, "start", d)}
                            className="text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 hover:bg-muted transition-colors tabular-nums"
                          >
                            {d > 0 ? `+${d}` : d}
                          </button>
                        ))}
                      </div>
                    </div>
                    {session.endTime !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">end</p>
                        <p className="text-xs tabular-nums">{formatTime(session.endTime)}</p>
                        <div className="flex gap-1">
                          {BUMP_OPTIONS.map((d) => (
                            <button
                              key={d}
                              onClick={() => handleBump(session._id, "end", d)}
                              className="text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 hover:bg-muted transition-colors tabular-nums"
                            >
                              {d > 0 ? `+${d}` : d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
