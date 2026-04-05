interface TagSuggestionDropdownProps {
  suggestions: string[];
  highlightedIndex: number;
  onSelect: (tag: string) => void;
}

export function TagSuggestionDropdown({ suggestions, highlightedIndex, onSelect }: TagSuggestionDropdownProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      role="listbox"
      className="absolute left-0 top-full z-50 mt-1 w-full min-w-32 border rounded-md bg-popover text-popover-foreground shadow-md py-1 max-h-48 overflow-y-auto"
    >
      {suggestions.map((tag, i) => (
        <div
          key={tag}
          role="option"
          aria-selected={i === highlightedIndex}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(tag)}
          className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${
            i === highlightedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-muted"
          }`}
        >
          #{tag}
        </div>
      ))}
    </div>
  );
}
