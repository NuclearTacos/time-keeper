"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Lightbulb } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFix, setLoadingFix] = useState(false);
  const submit = useMutation(api.feedback.submitFeedback);
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);

  function close() {
    setOpen(false);
    setText("");
  }

  async function handleSubmit() {
    if (!text.trim() || loading || loadingFix) return;
    setLoading(true);
    try {
      await submit({ text: text.trim() });
      close();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAndFix() {
    if (!text.trim() || loading || loadingFix) return;
    setLoadingFix(true);
    try {
      await submit({ text: text.trim() });
      await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText: text.trim() }),
      });
      close();
    } finally {
      setLoadingFix(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Leave feedback"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Lightbulb size={15} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-background border rounded-lg p-4 w-full max-w-sm mx-4 space-y-3 shadow-lg">
            <h2 className="text-sm font-semibold">Feedback</h2>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || loadingFix}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="What's on your mind? (Cmd+Enter to submit)"
              rows={4}
              className="w-full text-sm bg-transparent border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center justify-between">
              <a
                href="/feedback"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                view all
              </a>
              <div className="flex gap-3">
                <button
                  onClick={close}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || loadingFix || !text.trim()}
                  className="text-sm border rounded px-3 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {loading ? "submitting…" : "submit"}
                </button>
                {isAdmin === true && (
                  <button
                    onClick={handleSubmitAndFix}
                    disabled={loading || loadingFix || !text.trim()}
                    className="text-sm border rounded px-3 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    {loadingFix ? "fixing…" : "submit & fix"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
