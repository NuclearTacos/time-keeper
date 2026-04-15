"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Bell } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { CHANGELOG } from "../lib/changelog";

type LastSeen = { lastSeenAt: number; lastSeenCount: number | null } | null;

/**
 * Count how many CHANGELOG entries are "new" for this user.
 *
 * If lastSeenCount is set we compare by entry count: any entry added after
 * the user's last visit is at a lower index in the newest-first array.
 *
 * Legacy fallback (lastSeenCount === null): use the day-end timestamp logic
 * so users who visited before this field existed aren't shown a stale badge.
 */
function countUnseen(lastSeen: LastSeen): number {
  if (lastSeen === null) return CHANGELOG.length;
  if (lastSeen.lastSeenCount !== null) {
    return Math.max(0, CHANGELOG.length - lastSeen.lastSeenCount);
  }
  // Legacy: timestamp-based fallback
  return CHANGELOG.filter((entry) => {
    const entryDayEnd = new Date(entry.date + "T00:00:00Z").getTime() + 86400000;
    return entryDayEnd > lastSeen.lastSeenAt;
  }).length;
}

export function WhatsNewButton() {
  const [open, setOpen] = useState(false);
  const lastSeen = useQuery(api.whatsNew.getLastSeenAt);
  const markSeen = useMutation(api.whatsNew.markSeen);

  // lastSeen is `undefined` while loading, `null` if never seen, or the record.
  const unseenCount = lastSeen === undefined ? 0 : countUnseen(lastSeen);

  function handleOpen() {
    setOpen(true);
    markSeen({ count: CHANGELOG.length });
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="What's new"
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={15} />
        {unseenCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-foreground text-background text-[9px] font-semibold leading-none">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-background border rounded-lg w-full max-w-sm mx-4 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">What&apos;s New</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                close
              </button>
            </div>
            <ul className="divide-y max-h-96 overflow-y-auto">
              {CHANGELOG.map((entry, i) => {
                // Entry is "new" if it was added after the user's last visit.
                // With count-based tracking: entries at indices 0..(unseenCount-1) are new.
                // Legacy fallback: use day-end timestamp comparison.
                let isNew: boolean;
                if (lastSeen === null || lastSeen === undefined) {
                  isNew = true;
                } else if (lastSeen.lastSeenCount !== null) {
                  isNew = i < CHANGELOG.length - lastSeen.lastSeenCount;
                } else {
                  const entryDayEnd =
                    new Date(entry.date + "T00:00:00Z").getTime() + 86400000;
                  isNew = entryDayEnd > lastSeen.lastSeenAt;
                }
                return (
                  <li key={entry.id} className="px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {entry.title}
                      </span>
                      {isNew && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-foreground text-background leading-none">
                          new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {entry.date}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
