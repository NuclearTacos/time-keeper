"use client";

import type { BumpEntry } from "@/lib/useBumpAccumulator";

interface Props {
  entries: Record<string, BumpEntry>;
  onDismiss: () => void;
}

export function BumpToast({ entries, onDismiss }: Props) {
  const items = Object.values(entries);
  if (items.length === 0) return null;

  return (
    <div className="flex items-start justify-between gap-3 border rounded-md px-3 py-2 bg-muted/50 text-xs">
      <div className="space-y-0.5">
        {items.map((entry) => {
          const sign = entry.total > 0 ? "+" : "";
          return (
            <p key={entry.label} className="text-muted-foreground">
              {entry.label}:{" "}
              <span className="tabular-nums font-medium text-foreground">
                {sign}{entry.total} min
              </span>
            </p>
          );
        })}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
