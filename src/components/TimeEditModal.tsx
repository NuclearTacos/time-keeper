"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { epochMsToTimeString } from "@/lib/formatTime";

function epochMsToDateString(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateAndTimeToEpochMs(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

interface TimeEditModalProps {
  sessionId: Id<"sessions">;
  boundary: "start" | "end";
  currentEpochMs: number;
  onClose: () => void;
}

export function TimeEditModal({ sessionId, boundary, currentEpochMs, onClose }: TimeEditModalProps) {
  const [timeValue, setTimeValue] = useState(() => epochMsToTimeString(currentEpochMs));
  const [dateValue, setDateValue] = useState(() => epochMsToDateString(currentEpochMs));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const setSessionTime = useMutation(api.sessions.setSessionTime);

  async function handleSave() {
    const newTime = dateAndTimeToEpochMs(dateValue, timeValue);
    if (newTime === currentEpochMs) {
      onClose();
      return;
    }
    await setSessionTime({ sessionId, boundary, newTime });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background border rounded-lg p-4 w-full max-w-xs mx-4 space-y-3 shadow-lg">
        <h2 className="text-sm font-semibold">Edit {boundary} time</h2>
        <input
          autoFocus
          type="time"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") handleSave();
          }}
          className="w-full text-sm bg-transparent border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
        />
        {showDatePicker && (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") handleSave();
            }}
            className="w-full text-sm bg-transparent border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
          />
        )}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              showDatePicker
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={showDatePicker ? "Hide date picker" : "Change date"}
          >
            <Calendar size={13} />
            {showDatePicker ? "hide date" : "change date"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm border rounded px-3 py-1 hover:bg-muted transition-colors"
            >
              save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
