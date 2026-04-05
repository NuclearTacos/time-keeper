"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTagSuggestions } from "@/lib/useTagSuggestions";
import { TagSuggestionDropdown } from "./ui/tag-suggestion-dropdown";
import { getTagTextClass } from "@/lib/tagColors";

interface Props {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function ActiveTagsBar({ tags, onAdd, onRemove }: Props) {
  const [inputValue, setInputValue] = useState("");
  const tagColors = useQuery(api.tagColors.getTagColors);

  const { isOpen, suggestions, highlightedIndex, handleKeyDown: hookKeyDown, selectTag } =
    useTagSuggestions({ mode: "plain", inputValue, cursorPosition: 0, existingTags: tags });

  function addTag(tag: string) {
    onAdd(tag);
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const result = hookKeyDown(e);
    if (result.selectedTag) {
      addTag(result.selectedTag);
      return;
    }
    if (result.handled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag) addTag(tag);
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
          className={`flex items-center gap-0.5 border rounded px-1.5 py-0.5 ${getTagTextClass(tagColors?.[tag])}`}
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
      <div className="relative">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toLowerCase())}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "add tag…" : "+tag"}
          autoCapitalize="none"
          className="bg-transparent focus:outline-none text-xs placeholder:text-muted-foreground/50 w-16 min-w-0"
        />
        {isOpen && (
          <TagSuggestionDropdown
            suggestions={suggestions}
            highlightedIndex={highlightedIndex}
            onSelect={(tag) => { selectTag(tag); addTag(tag); }}
          />
        )}
      </div>
    </div>
  );
}
