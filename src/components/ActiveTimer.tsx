"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";

export function ActiveTimer() {
  const activeData = useQuery(api.sessions.getActiveSession);
  const stopSession = useMutation(api.sessions.stopActiveSession);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!activeData?.session) {
      setElapsedMs(0);
      return;
    }
    const startTime = activeData.session.startTime;
    setElapsedMs(Date.now() - startTime);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeData?.session?.startTime]);

  if (activeData === undefined) {
    return (
      <div className="border rounded-md p-4 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!activeData) {
    return (
      <div className="border rounded-md p-4 text-sm text-muted-foreground">
        No active timer. Start a task below.
      </div>
    );
  }

  const { task } = activeData;

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xs">●</span>
            <span className="font-semibold truncate">{task?.name ?? "Unknown task"}</span>
          </div>
          {task && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground border rounded px-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg tabular-nums">{formatDuration(elapsedMs)}</div>
          <button
            onClick={() => stopSession({})}
            className="text-xs border rounded px-2 py-1 mt-1 hover:bg-muted transition-colors"
          >
            stop
          </button>
        </div>
      </div>
    </div>
  );
}
