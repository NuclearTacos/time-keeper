"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { parseTags } from "@/lib/parseTags";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { getHashTokenAtCursor } from "@/lib/getHashTokenAtCursor";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";

interface Props {
  activeTags?: string[];
}

export function NewTaskInput({ activeTags = [] }: Props) {
  const [value, setValue] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startSession = useMutation(api.sessions.startSession);

  const { isOpen, suggestions, highlightedIndex, handleKeyDown: hookKeyDown, selectTag } =
    useTagSuggestions({ mode: "hash", inputValue: value, cursorPosition: cursorPos });

  function insertTag(tag: string) {
    const token = getHashTokenAtCursor(value, cursorPos);
    if (!token) return;
    const before = value.slice(0, token.startIndex);
    const after = value.slice(token.endIndex);
    const insertion = `#${tag} `;
    const newValue = before + insertion + after;
    const newCursor = before.length + insertion.length;
    setValue(newValue);
    setCursorPos(newCursor);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const { name, tags } = parseTags(trimmed);
    if (!name) return;
    const mergedTags = [...new Set([...activeTags, ...tags])];
    setLoading(true);
    try {
      await startSession({ name, tags: mergedTags });
      setValue("");
    } finally {
      setLoading(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const result = hookKeyDown(e);
    if (result.selectedTag) {
      insertTag(result.selectedTag);
    }
  }

  function trackCursor(e: React.SyntheticEvent<HTMLInputElement>) {
    setCursorPos(e.currentTarget.selectionStart ?? 0);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); trackCursor(e); }}
          onKeyDown={handleInputKeyDown}
          onClick={trackCursor}
          onKeyUp={trackCursor}
          placeholder="New task... use #tag for tags"
          disabled={loading}
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
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="border rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
      >
        start
      </button>
    </form>
  );
}
