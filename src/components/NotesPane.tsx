"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset preview mode and draft when switching tasks
  useEffect(() => {
    if (taskId !== prevTaskIdRef.current) {
      prevTaskIdRef.current = taskId;
      setIsPreview(false);
    }
  }, [taskId]);

  // Sync draft from server when task loads or changes identity
  useEffect(() => {
    if (task !== undefined) {
      setDraft(task?.notes ?? "");
    }
  }, [task?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand textarea whenever draft changes or edit mode is entered.
  // useLayoutEffect runs synchronously after DOM update so scrollHeight is accurate.
  useLayoutEffect(() => {
    if (isPreview) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isPreview]);

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
          className="text-sm min-h-[4rem] cursor-pointer [&_a]:text-violet-400 [&_a]:underline [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:font-bold [&_h1]:text-base [&_h2]:font-semibold [&_h3]:font-medium [&_p]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
          onClick={() => setIsPreview(false)}
          title="Click to edit"
          dangerouslySetInnerHTML={{
            __html: draft.trim() ? (marked(draft) as string) : '<p class="text-muted-foreground italic">No notes yet.</p>',
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write notes in markdown…"
          rows={1}
          className="w-full text-sm bg-transparent resize-none overflow-hidden focus:outline-none placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
}
