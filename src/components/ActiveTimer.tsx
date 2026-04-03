"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";
import { setLastUndo } from "@/lib/undo";

const BUMP_OPTIONS = [-15, -5, -1, 1, 5, 15];

export function ActiveTimer() {
  const activeData = useQuery(api.sessions.getActiveSession);
  const stopSession = useMutation(api.sessions.stopActiveSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const adjustSessionTime = useMutation(api.sessions.adjustSessionTime);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");

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
    setEditName(task.name);
    setEditTags(task.tags.map((t) => `#${t}`).join(" "));
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!task) return;
    if (editName.trim()) {
      const prevName = task.name;
      const prevTags = task.tags;
      const tags = editTags.trim()
        ? editTags.split(/\s+/).map((t) => t.replace(/^#/, "").toLowerCase()).filter(Boolean)
        : [];
      await updateTask({ taskId: task._id, name: editName.trim(), tags });
      setLastUndo(async () => {
        await updateTask({ taskId: task._id, name: prevName, tags: prevTags });
      });
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setIsEditing(false);
  }

  function handleContainerBlur(e: React.FocusEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    saveEdit();
  }

  const session = activeData.session;

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-xs shrink-0 mt-0.5">●</span>
            {isEditing ? (
              <div className="flex-1 space-y-1" onBlur={handleContainerBlur}>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm font-semibold bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                />
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="tags: #tag1 #tag2"
                  className="w-full text-xs bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 text-muted-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            ) : (
              <span
                className="font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={startEditing}
              >
                {task?.name ?? "Unknown task"}
              </span>
            )}
          </div>
          {!isEditing && task && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1" onClick={startEditing}>
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground border rounded px-1 cursor-pointer hover:text-foreground transition-colors"
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
      <div className="flex items-center gap-1.5 pt-1 border-t border-foreground/10">
        <span className="text-xs text-muted-foreground shrink-0">start:</span>
        <div className="flex gap-1">
          {BUMP_OPTIONS.map((display) => (
            <button
              key={display}
              onClick={() => adjustSessionTime({ sessionId: session._id, boundary: "start", deltaMinutes: -display })}
              className="text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 hover:bg-muted transition-colors tabular-nums"
            >
              {display > 0 ? `+${display}` : display}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
