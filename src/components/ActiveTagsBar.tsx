"use client";

import { useState } from "react";

interface Props {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function ActiveTagsBar({ tags, onAdd, onRemove }: Props) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag) {
        onAdd(tag);
        setInputValue("");
      }
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="shrink-0">context:</span>
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-0.5 border rounded px-1.5 py-0.5"
        >
          #{tag}
          <button
            onClick={() => onRemove(tag)}
            className="ml-0.5 hover:text-foreground transition-colors leading-none"
            aria-label={`Remove #${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "add tag…" : "+tag"}
        className="bg-transparent focus:outline-none text-xs placeholder:text-muted-foreground/50 w-16 min-w-0"
      />
    </div>
  );
}
