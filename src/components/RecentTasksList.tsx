"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";

export function RecentTasksList() {
  const recentTasks = useQuery(api.sessions.getRecentTasks, { limit: 10 });
  const startSession = useMutation(api.sessions.startSession);

  if (recentTasks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (recentTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <ul className="divide-y">
      {recentTasks.map(({ task, lastSessionStart }) => {
        const ago = formatTimeAgo(lastSessionStart);
        return (
          <li
            key={task._id}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{task.name}</p>
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{ago}</p>
            </div>
            <button
              onClick={() => startSession({ taskId: task._id })}
              className="shrink-0 text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
            >
              resume
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function formatTimeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
