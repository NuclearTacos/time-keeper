"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { ChevronDown, ChevronRight, X, Pencil, Check } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { getHashTokenAtCursor } from "@/lib/getHashTokenAtCursor";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";

interface TodoQueueProps {
  onSelectTask?: (taskId: Id<"tasks">) => void;
}

export function TodoQueue({ onSelectTask }: TodoQueueProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDate, setEditDate] = useState("");
  const [tagCursorPos, setTagCursorPos] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const queuedTasks = useQuery(api.tasks.getQueuedTasks);
  const startSession = useMutation(api.sessions.startSession);
  const dequeueTask = useMutation(api.tasks.dequeueTask);
  const updateQueuedTask = useMutation(api.tasks.updateQueuedTask);

  const { isOpen: tagSugOpen, suggestions: tagSuggestions, highlightedIndex: tagHlIndex, handleKeyDown: tagHookKeyDown, selectTag: tagSelectTag } =
    useTagSuggestions({ mode: "hash", inputValue: editTags, cursorPosition: tagCursorPos });

  if (!queuedTasks || queuedTasks.length === 0) return null;

  function startEdit(task: { _id: Id<"tasks">; name: string; tags: string[]; scheduledDate?: string }) {
    setEditName(task.name);
    setEditTags(task.tags.map((t) => `#${t}`).join(" "));
    setEditDate(task.scheduledDate ?? "");
    setEditingId(task._id);
    onSelectTask?.(task._id);
  }

  async function saveEdit(taskId: Id<"tasks">) {
    const tags = editTags.trim()
      ? editTags.split(/\s+/).map((t) => t.replace(/^#/, "").toLowerCase()).filter(Boolean)
      : [];
    await updateQueuedTask({
      taskId,
      name: editName.trim() || editName,
      tags,
      scheduledDate: editDate || undefined,
    });
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

  function handleTagKeyDown(e: React.KeyboardEvent, taskId: Id<"tasks">) {
    const result = tagHookKeyDown(e);
    if (result.selectedTag) { insertTagIntoEdit(result.selectedTag); return; }
    if (result.handled) return;
    if (e.key === "Enter") saveEdit(taskId);
    if (e.key === "Escape") setEditingId(null);
  }

  function trackTagCursor(e: React.SyntheticEvent<HTMLInputElement>) {
    setTagCursorPos(e.currentTarget.selectionStart ?? 0);
  }

  function handleContainerBlur(e: React.FocusEvent, taskId: Id<"tasks">) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    saveEdit(taskId);
  }

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays >= 2 && diffDays <= 6) return dayNames[d.getDay()];
    if (diffDays >= 7 && diffDays <= 13) return `Next ${dayNames[d.getDay()]}`;
    if (diffDays <= -2 && diffDays >= -13) return `Last ${dayNames[d.getDay()]}`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <section>
      <button
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        ToDo
        <span className="ml-0.5 text-muted-foreground/60">({queuedTasks.length})</span>
      </button>

      {expanded && (
        <ul className="divide-y">
          {queuedTasks.map((task) => {
            const isEditing = editingId === task._id;
            return (
              <li key={task._id} className="flex items-center justify-between gap-3 py-2 group">
                {isEditing ? (
                  <div
                    className="flex-1 space-y-1"
                    onBlur={(e) => handleContainerBlur(e, task._id)}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(task._id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full text-sm font-medium bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                    />
                    <div className="relative">
                      <input
                        ref={tagInputRef}
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">due</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(task._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="text-xs bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(task._id)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <p
                      className="text-sm font-medium truncate cursor-pointer hover:text-muted-foreground transition-colors"
                      onClick={() => startEdit(task)}
                    >
                      {task.name}
                    </p>
                    {task.scheduledDate && (
                      <span className="text-xs text-muted-foreground shrink-0 border rounded px-1.5 py-0.5">
                        {formatDate(task.scheduledDate)}
                      </span>
                    )}
                  </div>
                )}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-70 text-muted-foreground transition-all"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => dequeueTask({ taskId: task._id })}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-70 text-muted-foreground transition-all"
                      title="Remove from ToDo"
                    >
                      <X size={13} />
                    </button>
                    <button
                      onClick={() => startSession({ taskId: task._id })}
                      className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                    >
                      start
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
