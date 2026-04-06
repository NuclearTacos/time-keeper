"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Search, X } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { marked } from "marked";

interface NotesPaneProps {
  taskId: Id<"tasks"> | null;
  onClose: () => void;
}

export function NotesPane({ taskId, onClose }: NotesPaneProps) {
  const task = useQuery(
    api.tasks.getTask,
    taskId ? { taskId } : "skip"
  );
  const updateTaskNotes = useMutation(api.tasks.updateTaskNotes);

  const [draft, setDraft] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const prevTaskIdRef = useRef<Id<"tasks"> | null>(null);

  // Sync draft when task changes
  useEffect(() => {
    if (taskId !== prevTaskIdRef.current) {
      prevTaskIdRef.current = taskId;
      setIsPreview(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (task !== undefined) {
      setDraft(task?.notes ?? "");
    }
  }, [task]);

  async function handleBlur() {
    if (!taskId) return;
    const notes = draft.trim() || undefined;
    await updateTaskNotes({ taskId, notes });
  }

  if (!taskId) {
    return (
      <div className="border rounded-md p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            notes
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Close notes"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Select a task to view notes.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {task ? task.name : "notes"}
        </span>
        <button
          onClick={() => {
            if (isPreview) {
              onClose();
            } else {
              setIsPreview(true);
            }
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title={isPreview ? "Close notes" : "Preview markdown"}
        >
          {isPreview ? <X size={14} /> : <Search size={14} />}
        </button>
      </div>

      {isPreview ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm min-h-[6rem] cursor-pointer [&_a]:text-violet-400 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium"
          onClick={() => setIsPreview(false)}
          title="Click to edit"
          dangerouslySetInnerHTML={{
            __html: draft.trim() ? (marked(draft) as string) : '<p class="text-muted-foreground italic">No notes yet.</p>',
          }}
        />
      ) : (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write notes in markdown…"
          className="w-full min-h-[8rem] text-sm bg-transparent resize-y focus:outline-none placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
}
