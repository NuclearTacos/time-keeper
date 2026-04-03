"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { SessionList } from "@/components/SessionList";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getTime();
}

function endOfDay(dateStr: string): number {
  return new Date(dateStr + "T23:59:59.999").getTime();
}

export default function SessionsPage() {
  const today = toDateInputValue(new Date());

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const fromTime = startOfDay(fromDate);
  const toTime = endOfDay(toDate);

  const entries = useQuery(api.sessions.getSessionsInRange, { fromTime, toTime });
  const links = useQuery(api.sessions.getLinksInRange, { fromTime, toTime });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-sm font-semibold mb-3">Sessions</h1>
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

        {entries === undefined || links === undefined ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <SessionList entries={entries} links={links} />
        )}
      </main>
    </div>
  );
}
