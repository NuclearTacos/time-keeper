import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getHashTokenAtCursor } from "./getHashTokenAtCursor";

const MAX_SUGGESTIONS = 8;

interface UseTagSuggestionsOptions {
  mode: "hash" | "plain";
  inputValue: string;
  cursorPosition: number;
  existingTags?: string[];
}

interface HandleKeyDownResult {
  handled: boolean;
  selectedTag?: string;
}

export function useTagSuggestions({ mode, inputValue, cursorPosition, existingTags = [] }: UseTagSuggestionsOptions) {
  const allTags = useQuery(api.tasks.getAllUserTags) ?? [];
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const { suggestions, token } = useMemo(() => {
    if (mode === "hash") {
      const t = getHashTokenAtCursor(inputValue, cursorPosition);
      if (!t) return { suggestions: [], token: null };

      // Collect tags already in the input to exclude them
      const existing = new Set(
        [...inputValue.matchAll(/#(\S+)/g)].map((m) => m[1].toLowerCase())
      );

      const filtered = allTags
        .filter((tag) => tag.startsWith(t.query) && !existing.has(tag))
        .slice(0, MAX_SUGGESTIONS);

      return { suggestions: filtered, token: t.query };
    } else {
      // plain mode
      const query = inputValue.toLowerCase().trim();
      if (!query) return { suggestions: [], token: null };

      const excludeSet = new Set(existingTags.map((t) => t.toLowerCase()));
      const filtered = allTags
        .filter((tag) => tag.startsWith(query) && !excludeSet.has(tag))
        .slice(0, MAX_SUGGESTIONS);

      return { suggestions: filtered, token: query };
    }
  }, [mode, inputValue, cursorPosition, allTags, existingTags]);

  // Reset highlighted index when suggestions change
  const isOpen = suggestions.length > 0 && dismissed !== token;

  // Reset dismissed state when token changes
  useMemo(() => {
    if (token !== dismissed) setDismissed(null);
  }, [token, dismissed]);

  // Reset highlight when suggestions list changes
  useMemo(() => {
    setHighlightedIndex(-1);
  }, [suggestions.length, token]);

  const dismiss = useCallback(() => {
    setDismissed(token);
  }, [token]);

  const selectTag = useCallback((tag: string) => {
    setDismissed(tag);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): HandleKeyDownResult => {
      if (!isOpen) return { handled: false };

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return { handled: true };
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return { handled: true };
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        selectTag(selected);
        return { handled: true, selectedTag: selected };
      }

      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return { handled: true };
      }

      if (e.key === "Tab" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        selectTag(selected);
        return { handled: true, selectedTag: selected };
      }

      return { handled: false };
    },
    [isOpen, suggestions, highlightedIndex, selectTag, dismiss]
  );

  return {
    isOpen,
    suggestions,
    highlightedIndex,
    handleKeyDown,
    selectTag,
    dismiss,
  };
}
