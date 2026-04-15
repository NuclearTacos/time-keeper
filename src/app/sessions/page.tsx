"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { SessionList } from "@/components/SessionList";
import { toDateInputValue, startOfDay, endOfDay } from "@/lib/dateUtils";
import { parseTags } from "@/lib/parseTags";

function AddSessionForm({ defaultDate }: { defaultDate: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const createManualSession = useMutation(api.sessions.createManualSession);

  const today = toDateInputValue(new Date());

  function combineDateAndTime(dateStr: string, timeStr: string): number {
    return new Date(`${dateStr}T${timeStr}:00`).getTime();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = taskName.trim();
    if (!trimmed || !startTime) return;

    const { name, tags } = parseTags(trimmed);
    if (!name) return;

    const startEpoch = combineDateAndTime(date, startTime);
    const endEpoch = endTime ? combineDateAndTime(date, endTime) : undefined;

    if (endEpoch !== undefined && endEpoch <= startEpoch) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      await createManualSession({ name, tags, startTime: startEpoch, endTime: endEpoch });
      setTaskName("");
      setStartTime("");
      setEndTime("");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => { setDate(defaultDate); setIsOpen(true); }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        + add session
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-3 space-y-3 bg-background">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New session</p>
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Task name... use #tag for tags"
        autoCapitalize="sentences"
        autoFocus
        disabled={loading}
        className="w-full border rounded px-2 py-1.5 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      <div className="flex gap-2 flex-wrap">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">date</p>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            className="border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">start</p>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={loading}
            className="border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">end (optional)</p>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={loading}
            className="border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(""); }}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          cancel
        </button>
        <button
          type="submit"
          disabled={loading || !taskName.trim() || !startTime}
          className="border rounded px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          save session
        </button>
      </div>
    </form>
  );
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

        <AddSessionForm defaultDate={toDate} />

        {entries === undefined || links === undefined ? (
          <ul className="divide-y animate-pulse">
            {[65, 80, 55, 70].map((w, i) => (
              <li key={i} className="py-3 space-y-1.5">
                <div className="h-3.5 bg-muted-foreground/20 rounded" style={{ width: `${w}%` }} />
                <div className="h-2.5 bg-muted-foreground/10 rounded w-24" />
              </li>
            ))}
          </ul>
        ) : (
          <SessionList entries={entries} links={links} />
        )}
      </main>
    </div>
  );
}
