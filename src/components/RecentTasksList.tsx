"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Trash2, AlertTriangle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/formatDuration";
import { setLastUndo } from "@/lib/undo";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { getHashTokenAtCursor } from "@/lib/getHashTokenAtCursor";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";

export function RecentTasksList() {
  const startOfToday = getStartOfToday();
  const recentTasks = useQuery(api.sessions.getRecentTasks, { limit: 10, startOfToday });
  const activeData = useQuery(api.sessions.getActiveSession);
  const startSession = useMutation(api.sessions.startSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ taskId: Id<"tasks">; taskName: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [focusTags, setFocusTags] = useState(false);
  const [tagCursorPos, setTagCursorPos] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const clickedTagRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editingId || !clickedTagRef.current) return;
    const tag = clickedTagRef.current;
    clickedTagRef.current = null;
    const needle = `#${tag}`;
    const idx = editTags.indexOf(needle);
    if (idx === -1) return;
    const cursorPos = idx + needle.length;
    setTagCursorPos(cursorPos);
    tagInputRef.current?.focus();
    tagInputRef.current?.setSelectionRange(cursorPos, cursorPos);
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { isOpen: tagSugOpen, suggestions: tagSuggestions, highlightedIndex: tagHlIndex, handleKeyDown: tagHookKeyDown, selectTag: tagSelectTag } =
    useTagSuggestions({ mode: "hash", inputValue: editTags, cursorPosition: tagCursorPos });

  if (recentTasks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const activeTaskId = activeData?.task?._id;

  const visibleTasks = recentTasks.filter(({ task }) => task && task._id !== activeTaskId);

  if (visibleTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks today.</p>;
  }

  function startEditing(task: { _id: Id<"tasks">; name: string; tags: string[] }, focus: "name" | "tags" = "name", clickedTag?: string) {
    setEditName(task.name);
    setEditTags(task.tags.map((t) => `#${t}`).join(" "));
    setFocusTags(focus === "tags");
    clickedTagRef.current = clickedTag ?? null;
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

  function insertTagIntoEdit(tag: string) {
    const token = getHashTokenAtCursor(editTags, tagCursorPos);
    if (!token) return;
    const before = editTags.slice(0, token.startIndex);
    const after = editTags.slice(token.endIndex);
    const insertion = `#${tag} `;
    const newValue = before + insertion + after;
    const newCursor = before.length + insertion.length;
    setEditTags(newValue);
    setTagCursorPos(newCursor);
    requestAnimationFrame(() => {
      tagInputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent, taskId: Id<"tasks">) {
    if (e.key === "Enter") saveEdit(taskId);
    if (e.key === "Escape") setEditingId(null);
  }

  function handleTagKeyDown(e: React.KeyboardEvent, taskId: Id<"tasks">) {
    const result = tagHookKeyDown(e);
    if (result.selectedTag) {
      insertTagIntoEdit(result.selectedTag);
      return;
    }
    if (result.handled) return;
    handleKeyDown(e, taskId);
  }

  function trackTagCursor(e: React.SyntheticEvent<HTMLInputElement>) {
    setTagCursorPos(e.currentTarget.selectionStart ?? 0);
  }

  function handleContainerBlur(e: React.FocusEvent, taskId: Id<"tasks">) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    saveEdit(taskId);
  }

  return (
    <>
    <ul className="divide-y">
      {visibleTasks.map(({ task, lastSessionStart }) => {
        if (!task) return null;
        const ago = formatTimeAgo(lastSessionStart);
        const isEditing = editingId === task._id;
        return (
          <li
            key={task._id}
            className="flex items-center justify-between gap-4 py-2 group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isEditing ? (
                  <div
                    className="flex-1 space-y-1"
                    onBlur={(e) => handleContainerBlur(e, task._id)}
                  >
                    <input
                      autoFocus={!focusTags}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task._id)}
                      className="w-full text-sm font-medium bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                    />
                    <div className="relative">
                      <input
                        ref={tagInputRef}
                        autoFocus={focusTags}
                        value={editTags}
                        onChange={(e) => { setEditTags(e.target.value.toLowerCase()); trackTagCursor(e); }}
                        onKeyDown={(e) => handleTagKeyDown(e, task._id)}
                        onClick={trackTagCursor}
                        onKeyUp={trackTagCursor}
                        placeholder="tags: #tag1 #tag2"
                        autoCapitalize="none"
                        className="w-full text-xs bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 text-muted-foreground placeholder:text-muted-foreground/50"
                      />
                      {tagSugOpen && (
                        <TagSuggestionDropdown
                          suggestions={tagSuggestions}
                          highlightedIndex={tagHlIndex}
                          onSelect={(tag) => { tagSelectTag(tag); insertTagIntoEdit(tag); }}
                        />
                      )}
                    </div>
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
                <div className="flex flex-wrap gap-1 mt-0.5" onClick={() => startEditing(task, "tags")}>
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => { e.stopPropagation(); startEditing(task, "tags", tag); }}
                      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{ago}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setConfirmDelete({ taskId: task._id, taskName: task.name })}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                title="Delete task"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => startSession({ taskId: task._id })}
                className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
              >
                resume
              </button>
            </div>
          </li>
        );
      })}
    </ul>
    {confirmDelete && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
      >
        <div className="bg-background border rounded-lg p-5 w-full max-w-sm mx-4 shadow-lg">
          <div className="flex gap-3">
            <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold">Delete task</h2>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <span className="text-foreground font-medium">{confirmDelete.taskName}</span> and all its sessions.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
            <button
              onClick={() => setConfirmDelete(null)}
              className="text-sm border rounded px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              cancel
            </button>
            <button
              onClick={() => {
                deleteTask({ taskId: confirmDelete.taskId });
                setConfirmDelete(null);
              }}
              className="text-sm rounded px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              delete task
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function getStartOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
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
