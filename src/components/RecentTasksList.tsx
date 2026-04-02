"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";
import { setLastUndo } from "@/lib/undo";

export function RecentTasksList() {
  const recentTasks = useQuery(api.sessions.getRecentTasks, { limit: 10 });
  const activeData = useQuery(api.sessions.getActiveSession);
  const startSession = useMutation(api.sessions.startSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");

  if (recentTasks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const activeTaskId = activeData?.task?._id;

  const visibleTasks = recentTasks.filter(({ task }) => task && task._id !== activeTaskId);

  if (visibleTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  function startEditing(task: { _id: Id<"tasks">; name: string; tags: string[] }) {
    setEditName(task.name);
    setEditTags(task.tags.map((t) => `#${t}`).join(" "));
    setEditingId(task._id);
  }

  async function saveEdit(taskId: Id<"tasks">) {
    if (editName.trim()) {
      const task = recentTasks?.find((r) => r.task?._id === taskId)?.task;
      const prevName = task?.name ?? "";
      const prevTags = task?.tags ?? [];
      const tags = editTags.trim()
        ? editTags.split(/\s+/).map((t) => t.replace(/^#/, "").toLowerCase()).filter(Boolean)
        : [];
      await updateTask({ taskId, name: editName.trim(), tags });
      setLastUndo(async () => {
        await updateTask({ taskId, name: prevName, tags: prevTags });
      });
    }
    setEditingId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, taskId: Id<"tasks">) {
    if (e.key === "Enter") saveEdit(taskId);
    if (e.key === "Escape") setEditingId(null);
  }

  function handleContainerBlur(e: React.FocusEvent, taskId: Id<"tasks">) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    saveEdit(taskId);
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
                  <div
                    className="flex-1 space-y-1"
                    onBlur={(e) => handleContainerBlur(e, task._id)}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task._id)}
                      className="w-full text-sm font-medium bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task._id)}
                      placeholder="tags: #tag1 #tag2"
                      className="w-full text-xs bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                ) : (
                  <>
                    <p
                      className="text-sm font-medium truncate cursor-pointer hover:text-muted-foreground transition-colors"
                      onClick={() => startEditing(task)}
                    >
                      {task.name}
                    </p>
                  </>
                )}
              </div>
              {!isEditing && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5" onClick={() => startEditing(task)}>
                  {task.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
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
