"use client";

import { ActiveTimer } from "@/components/ActiveTimer";
import { NewTaskInput } from "@/components/NewTaskInput";
import { RecentTasksList } from "@/components/RecentTasksList";
import { NavBar } from "@/components/NavBar";
import { ActiveTagsBar } from "@/components/ActiveTagsBar";
import { BumpToast } from "@/components/BumpToast";
import { NotesPane } from "@/components/NotesPane";
import { TodoQueue } from "@/components/TodoQueue";
import { useActiveTags } from "@/lib/useActiveTags";
import { useBumpAccumulator } from "@/lib/useBumpAccumulator";
import { useEffect, useState } from "react";
import { popLastUndo } from "@/lib/undo";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function Home() {
  const { tags, addTag, removeTag } = useActiveTags();
  const bump = useBumpAccumulator();
  const activeData = useQuery(api.sessions.getActiveSession);

  const [notesPaneOpen, setNotesPaneOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  // Default to active task when pane opens with no selection
  const activeTaskId = activeData?.task?._id ?? null;
  const notesTaskId = selectedTaskId ?? activeTaskId;

  function handleSelectTask(taskId: Id<"tasks">) {
    setSelectedTaskId(taskId);
    setNotesPaneOpen(true);
  }

  function handleNoteIconClick(taskId: Id<"tasks">) {
    if (notesPaneOpen && notesTaskId === taskId) {
      setNotesPaneOpen(false);
    } else {
      setSelectedTaskId(taskId);
      setNotesPaneOpen(true);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        const undo = popLastUndo();
        if (undo) {
          e.preventDefault();
          undo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        notesOpen={notesPaneOpen}
        onToggleNotes={() => setNotesPaneOpen((v) => !v)}
      />
      <div
        className={cn(
          "flex-1 mx-auto w-full px-4 py-6",
          notesPaneOpen ? "max-w-4xl flex gap-6 items-start" : "max-w-lg"
        )}
      >
        <main className="flex-1 min-w-0 space-y-6">
          {bump.isActive && (
            <BumpToast entries={bump.entries} onDismiss={bump.dismiss} />
          )}
          <ActiveTimer onBump={bump.recordBump} onSelectTask={handleSelectTask} onNoteIconClick={handleNoteIconClick} />
          <div className="space-y-2">
            <ActiveTagsBar tags={tags} onAdd={addTag} onRemove={removeTag} />
            <NewTaskInput activeTags={tags} />
          </div>
          {/* Mobile: notes pane below new task input, above recent list */}
          {notesPaneOpen && (
            <div className="md:hidden">
              <NotesPane
                taskId={notesTaskId}
                onClose={() => setNotesPaneOpen(false)}
              />
            </div>
          )}
          <TodoQueue onSelectTask={handleSelectTask} />
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Recent
            </h2>
            <RecentTasksList onSelectTask={handleSelectTask} onNoteIconClick={handleNoteIconClick} />
          </section>
        </main>
        {/* Desktop: notes pane to the right */}
        {notesPaneOpen && (
          <aside className="hidden md:block w-80 shrink-0 sticky top-6">
            <NotesPane
              taskId={notesTaskId}
              onClose={() => setNotesPaneOpen(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
