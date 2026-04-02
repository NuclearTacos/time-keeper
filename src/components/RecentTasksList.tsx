"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";
import { parseTags } from "@/lib/parseTags";
import { Pencil } from "lucide-react";

export function RecentTasksList() {
  const recentTasks = useQuery(api.sessions.getRecentTasks, { limit: 10 });
  const activeData = useQuery(api.sessions.getActiveSession);
  const startSession = useMutation(api.sessions.startSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [editValue, setEditValue] = useState("");

  if (recentTasks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const activeTaskId = activeData?.task?._id;

  const visibleTasks = recentTasks.filter(({ task }) => task && task._id !== activeTaskId);

  if (visibleTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  function startEditing(task: { _id: Id<"tasks">; name: string; tags: string[] }) {
    const tagString = task.tags.map((t) => `#${t}`).join(" ");
    setEditValue(tagString ? `${task.name} ${tagString}` : task.name);
    setEditingId(task._id);
  }

  async function saveEdit(taskId: Id<"tasks">) {
    const { name, tags } = parseTags(editValue);
    if (name.trim()) {
      await updateTask({ taskId, name: name.trim(), tags });
    }
    setEditingId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, taskId: Id<"tasks">) {
    if (e.key === "Enter") saveEdit(taskId);
    if (e.key === "Escape") setEditingId(null);
  }

  return (
    <ul className="divide-y">
      {visibleTasks.map(({ task, lastSessionStart }) => {
        if (!task) return null;
        const ago = formatTimeAgo(lastSessionStart);
        const isEditing = editingId === task._id;
        return (
          <li
            key={task._id}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, task._id)}
                    onBlur={() => saveEdit(task._id)}
                    className="flex-1 text-sm font-medium bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{task.name}</p>
                    <button
                      onClick={() => startEditing(task)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                  </>
                )}
              </div>
              {!isEditing && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {task.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground">
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
