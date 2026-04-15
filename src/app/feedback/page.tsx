"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import type { Id } from "../../../convex/_generated/dataModel";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function FeedbackPage() {
  const entries = useQuery(api.feedback.listFeedback);
  const clearAll = useMutation(api.feedback.clearAllFeedback);
  const resolve = useMutation(api.feedback.resolveFeedback);
  const [showResolved, setShowResolved] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);

  async function handleFix(id: string, text: string) {
    setFixingId(id);
    try {
      await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText: text }),
      });
    } finally {
      setFixingId(null);
    }
  }

  const filtered = entries?.filter((e) => showResolved || !e.resolved);
  const resolvedCount = entries?.filter((e) => e.resolved).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Feedback</h1>
          <div className="flex items-center gap-3">
            {resolvedCount > 0 && (
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showResolved ? "hide resolved" : `show resolved (${resolvedCount})`}
              </button>
            )}
            {entries && entries.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all feedback?")) clearAll();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                clear all
              </button>
            )}
          </div>
        </div>

        {entries === undefined ? (
          <ul className="space-y-3 animate-pulse">
            {[3, 2, 4].map((lines, i) => (
              <li key={i} className="border rounded p-3 space-y-2">
                <div className="h-2.5 w-32 bg-muted-foreground/10 rounded" />
                {Array.from({ length: lines }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 bg-muted-foreground/10 rounded"
                    style={{ width: j === lines - 1 ? "60%" : "100%" }}
                  />
                ))}
              </li>
            ))}
          </ul>
        ) : filtered!.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {entries.length === 0 ? "No feedback yet." : "No unresolved feedback."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered!.map((entry) => (
              <li
                key={entry._id}
                className={`border rounded p-3 space-y-1 ${entry.resolved ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                    {entry.resolved && (
                      <span className="text-xs text-green-600 border border-green-500/30 rounded px-1.5 py-0.5 bg-green-500/10">
                        resolved
                      </span>
                    )}
                  </div>
                  {!entry.resolved && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleFix(entry._id, entry.text)}
                        disabled={fixingId === entry._id}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                      >
                        {fixingId === entry._id ? "fixing…" : "fix"}
                      </button>
                      <button
                        onClick={() => resolve({ feedbackId: entry._id as Id<"feedback"> })}
                        className="text-xs text-muted-foreground hover:text-green-600 transition-colors"
                      >
                        resolve
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
