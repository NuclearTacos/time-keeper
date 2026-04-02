"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";
import { parseTags } from "@/lib/parseTags";
import { Pencil } from "lucide-react";

export function ActiveTimer() {
  const activeData = useQuery(api.sessions.getActiveSession);
  const stopSession = useMutation(api.sessions.stopActiveSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

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

  function startEditing() {
    if (!task) return;
    const tagString = task.tags.map((t) => `#${t}`).join(" ");
    setEditValue(tagString ? `${task.name} ${tagString}` : task.name);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!task) return;
    const { name, tags } = parseTags(editValue);
    if (name.trim()) {
      await updateTask({ taskId: task._id, name: name.trim(), tags });
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setIsEditing(false);
  }

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xs shrink-0">●</span>
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="flex-1 text-sm font-semibold bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
              />
            ) : (
              <>
                <span className="font-semibold truncate">{task?.name ?? "Unknown task"}</span>
                <button
                  onClick={startEditing}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
          {!isEditing && task && task.tags.length > 0 && (
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
