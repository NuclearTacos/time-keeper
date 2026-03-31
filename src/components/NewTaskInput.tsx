"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { parseTags } from "@/lib/parseTags";

export function NewTaskInput() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const startSession = useMutation(api.sessions.startSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const { name, tags } = parseTags(trimmed);
    if (!name) return;
    setLoading(true);
    try {
      await startSession({ name, tags });
      setValue("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New task... use #tag for tags"
        disabled={loading}
        className="flex-1 border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="border rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
      >
        start
      </button>
    </form>
  );
}
