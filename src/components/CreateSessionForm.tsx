"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { parseTags } from "@/lib/parseTags";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { getHashTokenAtCursor } from "@/lib/getHashTokenAtCursor";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";

interface Props {
  /** YYYY-MM-DD string used to seed default start/end times */
  defaultDate: string;
}

function toDatetimeLocal(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartForDate(dateStr: string): string {
  // 9:00 AM on the given date
  return `${dateStr}T09:00`;
}

function defaultEndForDate(dateStr: string): string {
  // 10:00 AM on the given date
  return `${dateStr}T10:00`;
}

export function CreateSessionForm({ defaultDate }: Props) {
  const [open, setOpen] = useState(false);
  const [taskValue, setTaskValue] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [startTime, setStartTime] = useState(() => defaultStartForDate(defaultDate));
  const [endTime, setEndTime] = useState(() => defaultEndForDate(defaultDate));
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createSession = useMutation(api.sessions.createSession);

  const { isOpen, suggestions, highlightedIndex, handleKeyDown: hookKeyDown, selectTag } =
    useTagSuggestions({ mode: "hash", inputValue: taskValue, cursorPosition: cursorPos });

  function insertTag(tag: string) {
    const token = getHashTokenAtCursor(taskValue, cursorPos);
    if (!token) return;
    const before = taskValue.slice(0, token.startIndex);
    const after = taskValue.slice(token.endIndex);
    const insertion = `#${tag} `;
    const newValue = before + insertion + after;
    const newCursor = before.length + insertion.length;
    setTaskValue(newValue);
    setCursorPos(newCursor);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  function trackCursor(e: React.SyntheticEvent<HTMLInputElement>) {
    setCursorPos(e.currentTarget.selectionStart ?? 0);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const result = hookKeyDown(e);
    if (result.selectedTag) {
      insertTag(result.selectedTag);
    }
  }

  function handleOpen() {
    setOpen(true);
    setStartTime(defaultStartForDate(defaultDate));
    setEndTime(defaultEndForDate(defaultDate));
    setTaskValue("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = taskValue.trim();
    if (!trimmed) return;
    const { name, tags } = parseTags(trimmed);
    if (!name) return;

    const startMs = new Date(startTime).getTime();
    const endMs = endTime ? new Date(endTime).getTime() : undefined;

    setLoading(true);
    try {
      await createSession({ name, tags, startTime: startMs, endTime: endMs });
      setOpen(false);
      setTaskValue("");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        + add session
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-3 space-y-3 bg-muted/30">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={taskValue}
          onChange={(e) => { setTaskValue(e.target.value); trackCursor(e); }}
          onKeyDown={handleInputKeyDown}
          onClick={trackCursor}
          onKeyUp={trackCursor}
          placeholder="Task name... use #tag for tags"
          disabled={loading}
          autoFocus
          autoCapitalize="none"
          className="w-full border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        {isOpen && (
          <TagSuggestionDropdown
            suggestions={suggestions}
            highlightedIndex={highlightedIndex}
            onSelect={(tag) => { selectTag(tag); insertTag(tag); }}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">start</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={loading}
            className="w-full border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">end</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={loading}
            className="w-full border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="text-sm border rounded px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          cancel
        </button>
        <button
          type="submit"
          disabled={loading || !taskValue.trim()}
          className="text-sm border rounded px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
        >
          create
        </button>
      </div>
    </form>
  );
}
