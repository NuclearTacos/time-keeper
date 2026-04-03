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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-start justify-between gap-3 border rounded-lg px-4 py-2.5 bg-background shadow-lg text-xs w-max max-w-[calc(100vw-2rem)]">
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
