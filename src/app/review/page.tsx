"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { TimeBreakdownByTask } from "@/components/TimeBreakdownByTask";
import { TimeBreakdownByTag } from "@/components/TimeBreakdownByTag";
import { SessionList } from "@/components/SessionList";
import { BumpToast } from "@/components/BumpToast";
import { useBumpAccumulator } from "@/lib/useBumpAccumulator";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getTime();
}

function endOfDay(dateStr: string): number {
  return new Date(dateStr + "T23:59:59.999").getTime();
}

export default function ReviewPage() {
  const today = toDateInputValue(new Date());
  const sevenDaysAgo = toDateInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);
  const bump = useBumpAccumulator();

  const entries = useQuery(api.sessions.getSessionsInRange, {
    fromTime: startOfDay(fromDate),
    toTime: endOfDay(toDate),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6">
        {bump.isActive && (
          <BumpToast entries={bump.entries} onDismiss={bump.dismiss} />
        )}
        <div>
          <h1 className="text-sm font-semibold mb-3">Review</h1>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {entries === undefined ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                By task
              </h2>
              <TimeBreakdownByTask entries={entries} />
            </section>
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                By tag
              </h2>
              <TimeBreakdownByTag entries={entries} />
            </section>
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Sessions
              </h2>
              <SessionList
                entries={entries}
                onBump={bump.recordBump}
                lockedPairs={bump.lockedPairs}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
