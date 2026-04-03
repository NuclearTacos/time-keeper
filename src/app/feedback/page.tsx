"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function FeedbackPage() {
  const entries = useQuery(api.feedback.listFeedback);
  const clearAll = useMutation(api.feedback.clearAllFeedback);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Feedback</h1>
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

        {entries === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry._id} className="border rounded p-3 space-y-1">
                <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
