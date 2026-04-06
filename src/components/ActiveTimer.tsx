"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link2, ExternalLink } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatDuration } from "@/lib/formatDuration";
import { formatTime } from "@/lib/formatTime";
import { setLastUndo } from "@/lib/undo";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { getHashTokenAtCursor } from "@/lib/getHashTokenAtCursor";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";
import { TimeEditModal } from "./TimeEditModal";
import { getTagTextClass } from "@/lib/tagColors";

const BUMP_OPTIONS = [-5, -1, 1, 5];

interface Props {
  onBump?: (key: string, label: string, deltaMin: number) => void;
  onSelectTask?: (taskId: Id<"tasks">) => void;
}

export function ActiveTimer({ onBump, onSelectTask }: Props) {
  const activeData = useQuery(api.sessions.getActiveSession);
  const tagColors = useQuery(api.tagColors.getTagColors);
  const stopSession = useMutation(api.sessions.stopActiveSession);
  const updateTask = useMutation(api.tasks.updateTask);
  const adjustSessionTime = useMutation(api.sessions.adjustSessionTime);
  const updateTaskUrl = useMutation(api.tasks.updateTaskUrl);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [focusTags, setFocusTags] = useState(false);
  const [editingStart, setEditingStart] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [tagCursorPos, setTagCursorPos] = useState(0);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const clickedTagRef = useRef<string | null>(null);

  const { isOpen: tagSugOpen, suggestions: tagSuggestions, highlightedIndex: tagHlIndex, handleKeyDown: tagHookKeyDown, selectTag: tagSelectTag } =
    useTagSuggestions({ mode: "hash", inputValue: editTags, cursorPosition: tagCursorPos });

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

  useEffect(() => {
    if (!isEditing || !clickedTagRef.current) return;
    const tag = clickedTagRef.current;
    clickedTagRef.current = null;
    const needle = `#${tag}`;
    const idx = editTags.indexOf(needle);
    if (idx === -1) return;
    const cursorPos = idx + needle.length;
    setTagCursorPos(cursorPos);
    tagInputRef.current?.focus();
    tagInputRef.current?.setSelectionRange(cursorPos, cursorPos);
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const session = activeData.session;

  function startEditing(focus: "name" | "tags" = "name", clickedTag?: string) {
    if (!task) return;
    setEditName(task.name);
    setEditTags(task.tags.map((t) => `#${t}`).join(" "));
    setFocusTags(focus === "tags");
    clickedTagRef.current = clickedTag ?? null;
    setIsEditing(true);
    onSelectTask?.(task._id);
  }

  function openUrlEditor() {
    if (!task) return;
    setUrlDraft(task.url ?? "");
    setEditingUrl(true);
    requestAnimationFrame(() => urlInputRef.current?.focus());
  }

  async function saveUrl() {
    if (!task) return;
    const url = urlDraft.trim() || undefined;
    await updateTaskUrl({ taskId: task._id, url });
    setEditingUrl(false);
  }

  function handleUrlKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveUrl();
    if (e.key === "Escape") setEditingUrl(false);
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setIsEditing(false);
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    const result = tagHookKeyDown(e);
    if (result.selectedTag) {
      insertTagIntoEdit(result.selectedTag);
      return;
    }
    if (result.handled) return;
    handleKeyDown(e);
  }

  function trackTagCursor(e: React.SyntheticEvent<HTMLInputElement>) {
    setTagCursorPos(e.currentTarget.selectionStart ?? 0);
  }

  function handleContainerBlur(e: React.FocusEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    saveEdit();
  }

  function handleBump(display: number) {
    adjustSessionTime({ sessionId: session._id, boundary: "start", deltaMinutes: display });
    onBump?.(`${session._id}-start`, "start", display);
  }

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-xs shrink-0 mt-0.5">●</span>
            {isEditing ? (
              <div className="flex-1 space-y-1" onBlur={handleContainerBlur}>
                <input
                  autoFocus={!focusTags}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm font-semibold bg-transparent border-b border-foreground/30 focus:outline-none focus:border-foreground"
                />
                <div className="relative">
                  <input
                    ref={tagInputRef}
                    autoFocus={focusTags}
                    value={editTags}
                    onChange={(e) => { setEditTags(e.target.value.toLowerCase()); trackTagCursor(e); }}
                    onKeyDown={handleTagKeyDown}
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
              <span
                className="font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={() => startEditing()}
              >
                {task?.name ?? "Unknown task"}
              </span>
            )}
          </div>
          {!isEditing && task && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1" onClick={() => startEditing("tags")}>
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => { e.stopPropagation(); startEditing("tags", tag); }}
                  className={`text-xs border rounded px-1 cursor-pointer transition-colors ${getTagTextClass(tagColors?.[tag]) || "text-muted-foreground hover:text-foreground"}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div className="font-mono text-lg tabular-nums">{formatDuration(elapsedMs, elapsedMs < 120_000)}</div>
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={openUrlEditor}
              className={task?.url ? "text-violet-400 hover:text-violet-300 transition-colors" : "text-muted-foreground opacity-40 hover:opacity-70 transition-opacity"}
              title={task?.url ? "Edit link" : "Add link"}
            >
              <Link2 size={13} />
            </button>
            <button
              onClick={() => stopSession({})}
              className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
            >
              stop
            </button>
          </div>
        </div>
      </div>
      {editingUrl && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-foreground/10">
          <input
            ref={urlInputRef}
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            onBlur={saveUrl}
            placeholder="https://…"
            className="flex-1 text-xs bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 text-muted-foreground placeholder:text-muted-foreground/50"
          />
          {urlDraft.trim() && (
            <a
              href={urlDraft.trim()}
              target="_blank"
              rel="noopener noreferrer"
              onMouseDown={(e) => e.preventDefault()}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Open link"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-1 border-t border-foreground/10">
        <button
          onClick={() => setEditingStart(true)}
          className="text-xs text-muted-foreground shrink-0 hover:text-foreground hover:underline cursor-pointer transition-colors tabular-nums"
        >
          start: {formatTime(session.startTime)}
        </button>
        <div className="flex gap-1">
          {BUMP_OPTIONS.map((display) => (
            <button
              key={display}
              onClick={() => handleBump(display)}
              className="text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 hover:bg-muted transition-colors tabular-nums"
            >
              {display > 0 ? `+${display}` : display}
            </button>
          ))}
        </div>
      </div>
      {editingStart && (
        <TimeEditModal
          sessionId={session._id}
          boundary="start"
          currentEpochMs={session.startTime}
          onClose={() => setEditingStart(false)}
        />
      )}
    </div>
  );
}
