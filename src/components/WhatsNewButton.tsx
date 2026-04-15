"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Bell } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { CHANGELOG } from "../lib/changelog";

/** An entry dated YYYY-MM-DD is considered "unseen" if the start of the
 *  following day (UTC) is strictly after lastSeenAt.  Using end-of-day rather
 *  than start-of-day means entries added on the same calendar day as a prior
 *  feed visit still show up as new. */
function countUnseen(lastSeenAt: number | null): number {
  if (lastSeenAt === null) return CHANGELOG.length;
  return CHANGELOG.filter((entry) => {
    const entryDayEnd = new Date(entry.date + "T00:00:00Z").getTime() + 86400000;
    return entryDayEnd > lastSeenAt;
  }).length;
}

export function WhatsNewButton() {
  const [open, setOpen] = useState(false);
  const lastSeenAt = useQuery(api.whatsNew.getLastSeenAt);
  const markSeen = useMutation(api.whatsNew.markSeen);

  const unseenCount =
    lastSeenAt === undefined ? 0 : countUnseen(lastSeenAt);

  function handleOpen() {
    setOpen(true);
    // Record that the user has now seen all entries.
    markSeen();
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
              {CHANGELOG.map((entry) => {
                const entryTime = new Date(
                  entry.date + "T00:00:00Z"
                ).getTime();
                const isNew =
                  lastSeenAt === null ||
                  entryTime + 86400000 > (lastSeenAt ?? 0);
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
