"use client";

import { ActiveTimer } from "@/components/ActiveTimer";
import { NewTaskInput } from "@/components/NewTaskInput";
import { RecentTasksList } from "@/components/RecentTasksList";
import { NavBar } from "@/components/NavBar";
import { ActiveTagsBar } from "@/components/ActiveTagsBar";
import { useActiveTags } from "@/lib/useActiveTags";
import { useEffect } from "react";
import { popLastUndo } from "@/lib/undo";

export default function Home() {
  const { tags, addTag, removeTag } = useActiveTags();

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
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6">
        <ActiveTimer />
        <div className="space-y-2">
          <ActiveTagsBar tags={tags} onAdd={addTag} onRemove={removeTag} />
          <NewTaskInput activeTags={tags} />
        </div>
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent
          </h2>
          <RecentTasksList />
        </section>
      </main>
    </div>
  );
}
