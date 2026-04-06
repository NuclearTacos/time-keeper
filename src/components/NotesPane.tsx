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

/**
 * Given a click position inside a rendered-markdown div, find the
 * approximate cursor position in the raw markdown string.
 *
 * Strategy: walk text nodes before the caret to get the rendered-text
 * offset, then advance through the markdown character-by-character,
 * matching rendered characters as a subsequence (skipping markdown
 * syntax characters that don't appear in the rendered output).
 */
function getMarkdownPosFromClick(
  previewEl: HTMLElement,
  clientX: number,
  clientY: number,
  markdown: string
): number {
  // Get the caret position in the rendered DOM (cross-browser)
  let caretNode: Node | null = null;
  let caretOffset = 0;

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(clientX, clientY);
    if (range) { caretNode = range.startContainer; caretOffset = range.startOffset; }
  } else {
    // Firefox
    const pos = (document as any).caretPositionFromPoint?.(clientX, clientY);
    if (pos) { caretNode = pos.offsetNode; caretOffset = pos.offset; }
  }
  if (!caretNode) return markdown.length;

  // Sum up text characters before the caret in the preview element
  let renderedBefore = 0;
  const walker = document.createTreeWalker(previewEl, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  let found = false;
  while ((node = walker.nextNode() as Text | null)) {
    if (node === caretNode) {
      renderedBefore += caretOffset;
      found = true;
      break;
    }
    renderedBefore += node.textContent?.length ?? 0;
  }
  if (!found) return markdown.length;

  // Map rendered-text offset → markdown offset via subsequence matching.
  // Walk the markdown; whenever the current markdown char matches the
  // next expected rendered char, consume a rendered char. Stop when we've
  // consumed `renderedBefore` rendered chars.
  const rendered = previewEl.textContent ?? "";
  let mdPos = 0;
  let matchPos = 0;
  while (mdPos < markdown.length && matchPos < renderedBefore) {
    if (markdown[mdPos] === rendered[matchPos]) matchPos++;
    mdPos++;
  }
  return mdPos;
}

export function NotesPane({ taskId, onClose }: NotesPaneProps) {
  const task = useQuery(api.tasks.getTask, taskId ? { taskId } : "skip");
  const updateTaskNotes = useMutation(api.tasks.updateTaskNotes);

  const [draft, setDraft] = useState("");
  const [isPreview, setIsPreview] = useState(true);
  const prevTaskIdRef = useRef<Id<"tasks"> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to view mode when switching tasks
  useEffect(() => {
    if (taskId !== prevTaskIdRef.current) {
      prevTaskIdRef.current = taskId;
      setIsPreview(true);
    }
  }, [taskId]);

  // Sync draft from server when task identity changes
  useEffect(() => {
    if (task !== undefined) {
      setDraft(task?.notes ?? "");
    }
  }, [task?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep draft in sync with server while in view mode (e.g. edits from another device)
  useEffect(() => {
    if (isPreview && task !== undefined) {
      setDraft(task?.notes ?? "");
    }
  }, [task?.notes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand textarea; useLayoutEffect so scrollHeight is accurate
  useLayoutEffect(() => {
    if (isPreview) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isPreview]);

  async function save() {
    if (!taskId) return;
    await updateTaskNotes({ taskId, notes: draft.trim() || undefined });
  }

  // Blur the container → save and switch to preview
  function handleContainerBlur(e: React.FocusEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (!isPreview) {
      save();
      setIsPreview(true);
    }
  }

  // Toggle a checkbox in the markdown source by index
  function handleCheckboxToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLInputElement;
    const checkboxes = previewRef.current?.querySelectorAll('input[type="checkbox"]');
    if (!checkboxes) return;

    let checkboxIndex = -1;
    checkboxes.forEach((cb, i) => { if (cb === target) checkboxIndex = i; });
    if (checkboxIndex === -1) return;

    const pattern = /- \[([ xX])\]/g;
    let match: RegExpExecArray | null;
    let currentIndex = 0;
    while ((match = pattern.exec(draft)) !== null) {
      if (currentIndex === checkboxIndex) {
        const isChecked = match[1] !== " ";
        const replacement = isChecked ? "- [ ]" : "- [x]";
        const newDraft = draft.slice(0, match.index) + replacement + draft.slice(match.index + match[0].length);
        setDraft(newDraft);
        if (taskId) updateTaskNotes({ taskId, notes: newDraft.trim() || undefined });
        return;
      }
      currentIndex++;
    }
  }

  // Click in preview → switch to edit, restoring cursor position
  function handlePreviewClick(e: React.MouseEvent) {
    // Don't intercept link clicks
    if ((e.target as HTMLElement).closest("a")) return;

    // Handle checkbox clicks without leaving preview
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "checkbox") {
      handleCheckboxToggle(e);
      return;
    }

    const el = previewRef.current;
    if (!el) { setIsPreview(false); return; }

    const mdPos = getMarkdownPosFromClick(el, e.clientX, e.clientY, draft);
    setIsPreview(false);

    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(mdPos, mdPos);
    });
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

  if (task === undefined) {
    return (
      <div className="border rounded-md p-4 space-y-2 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-muted-foreground/20" />
          <div className="w-3.5 h-3.5 rounded bg-muted-foreground/20" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-3 rounded bg-muted-foreground/10 w-full" />
          <div className="h-3 rounded bg-muted-foreground/10 w-4/5" />
          <div className="h-3 rounded bg-muted-foreground/10 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border rounded-md p-4 space-y-2"
      onBlur={handleContainerBlur}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {task ? task.name : "notes"}
        </span>
        <button
          onClick={() => {
            if (isPreview) {
              onClose();
            } else {
              save();
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
          ref={previewRef}
          className="text-sm min-h-[4rem] cursor-text [&_a]:text-violet-400 [&_a]:underline [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:font-bold [&_h1]:text-base [&_h2]:font-semibold [&_h3]:font-medium [&_p]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_li:has(>input[type=checkbox])]:list-none [&_input[type=checkbox]]:mr-2 [&_input[type=checkbox]]:accent-violet-500 [&_input[type=checkbox]]:cursor-pointer"
          onClick={handlePreviewClick}
          dangerouslySetInnerHTML={{
            __html: draft.trim()
              ? (marked(draft) as string).replace(/ disabled=""/g, "")
              : '<p class="text-muted-foreground/50 italic text-sm">No notes yet. Click to edit.</p>',
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            // Only save on blur; container blur handles switching to preview
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              save();
            }
          }}
          placeholder="Write notes in markdown…"
          rows={1}
          className="w-full text-sm bg-transparent resize-none overflow-hidden focus:outline-none placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
}
