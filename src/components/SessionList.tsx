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
}

const BUMP_OPTIONS = [-15, -5, -1, 1, 5, 15];

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

export function SessionList({ entries }: Props) {
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">{formatTime(session.startTime)}</span>
                    {session.endTime !== undefined && (
                      <>
                        <span>→</span>
                        <span className="tabular-nums">{formatTime(session.endTime)}</span>
                      </>
                    )}
                  </div>
                  <BumpRow
                    label="start"
                    onBump={(display) =>
                      adjustSessionTime({ sessionId: session._id, boundary: "start", deltaMinutes: -display })
                    }
                  />
                  {session.endTime !== undefined && (
                    <BumpRow
                      label="end"
                      onBump={(display) =>
                        adjustSessionTime({ sessionId: session._id, boundary: "end", deltaMinutes: display })
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function BumpRow({ label, onBump }: { label: string; onBump: (display: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground w-8 shrink-0">{label}:</span>
      <div className="flex gap-1">
        {BUMP_OPTIONS.map((display) => (
          <button
            key={display}
            onClick={() => onBump(display)}
            className="text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 hover:bg-muted transition-colors tabular-nums"
          >
            {display > 0 ? `+${display}` : display}
          </button>
        ))}
      </div>
    </div>
  );
}
