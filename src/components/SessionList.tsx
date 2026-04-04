"use client";

import { Fragment, useState } from "react";
import { useMutation } from "convex/react";
import { Link2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatTime } from "@/lib/formatTime";
import { TimeEditModal } from "./TimeEditModal";

interface Session {
  _id: Id<"sessions">;
  startTime: number;
  endTime?: number;
}

interface Entry {
  session: Session;
  task: { name: string; tags: string[] } | null;
}

interface Link {
  _id: Id<"sessionLinks">;
  endSessionId: Id<"sessions">;
  startSessionId: Id<"sessions">;
}

interface Props {
  entries: Entry[];
  links: Link[];
}

const BUMP_OPTIONS = [-5, -1, 1, 5];

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDurationMs(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function findLink(
  a: Session,
  b: Session,
  links: Link[]
): Link | undefined {
  return links.find(
    (l) => l.endSessionId === a._id && l.startSessionId === b._id
  );
}

export function SessionList({ entries, links }: Props) {
  const adjustSessionTime = useMutation(api.sessions.adjustSessionTime);
  const createLink = useMutation(api.sessions.createSessionLink);
  const deleteLink = useMutation(api.sessions.deleteSessionLink);
  const [editTarget, setEditTarget] = useState<{
    sessionId: Id<"sessions">;
    boundary: "start" | "end";
    currentTime: number;
  } | null>(null);

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
      {[...byDate.entries()].reverse().map(([date, dayEntries]) => {
        const sorted = [...dayEntries].sort(
          (a, b) => b.session.startTime - a.session.startTime
        );
        return (
          <div key={date}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {date}
            </p>
            <ul>
              {sorted.map(({ session, task }, i) => {
                const duration = session.endTime
                  ? formatDurationMs(session.endTime - session.startTime)
                  : null;
                // In descending order, sorted[i+1] is the earlier (ending) session
                const next = sorted[i + 1]?.session;
                const link = next ? findLink(next, session, links) : undefined;
                const isLinked = !!link;
                const showLinkToggle = !!(next && next.endTime !== undefined);

                return (
                  <Fragment key={session._id}>
                    <li className="py-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {task?.name ?? "Unknown task"}
                        </p>
                        {duration && (
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {duration}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">start</p>
                          <button
                            onClick={() => setEditTarget({ sessionId: session._id, boundary: "start", currentTime: session.startTime })}
                            className="text-xs tabular-nums hover:text-foreground hover:underline cursor-pointer transition-colors text-left"
                          >
                            {formatTime(session.startTime)}
                          </button>
                          <div className="flex gap-1">
                            {BUMP_OPTIONS.map((d) => (
                              <button
                                key={d}
                                onClick={() =>
                                  adjustSessionTime({
                                    sessionId: session._id,
                                    boundary: "start",
                                    deltaMinutes: d,
                                  })
                                }
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
                            <button
                              onClick={() => setEditTarget({ sessionId: session._id, boundary: "end", currentTime: session.endTime! })}
                              className="text-xs tabular-nums hover:text-foreground hover:underline cursor-pointer transition-colors text-left"
                            >
                              {formatTime(session.endTime)}
                            </button>
                            <div className="flex gap-1">
                              {BUMP_OPTIONS.map((d) => (
                                <button
                                  key={d}
                                  onClick={() =>
                                    adjustSessionTime({
                                      sessionId: session._id,
                                      boundary: "end",
                                      deltaMinutes: d,
                                    })
                                  }
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
                    {i < sorted.length - 1 && (
                      <li className="flex items-center gap-2">
                        <div className="flex-1 border-t border-border" />
                        {showLinkToggle && (
                          <button
                            onClick={() =>
                              isLinked
                                ? deleteLink({ linkId: link!._id })
                                : createLink({
                                    endSessionId: next!._id,
                                    startSessionId: session._id,
                                  })
                            }
                            title={isLinked ? "Unlink boundaries" : "Link boundaries"}
                            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border transition-colors ${
                              isLinked
                                ? "border-green-500/40 text-green-600 bg-green-500/10 hover:border-border hover:text-muted-foreground hover:bg-muted"
                                : "border-border text-muted-foreground hover:border-green-500/30 hover:text-green-600 hover:bg-green-500/5"
                            }`}
                          >
                            {isLinked && <Link2 size={10} />}
                            {isLinked ? "linked" : "link"}
                          </button>
                        )}
                        <div className="flex-1 border-t border-border" />
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ul>
          </div>
        );
      })}
      {editTarget && (
        <TimeEditModal
          sessionId={editTarget.sessionId}
          boundary={editTarget.boundary}
          currentEpochMs={editTarget.currentTime}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
