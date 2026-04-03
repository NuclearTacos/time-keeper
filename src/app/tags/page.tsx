"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";

export default function TagsPage() {
  const knownTags = useQuery(api.tasks.getAllUserTags);
  const hierarchy = useQuery(api.tagHierarchy.getTagHierarchy);
  const setSupertag = useMutation(api.tagHierarchy.setTagSupertag);
  const removeSupertag = useMutation(api.tagHierarchy.removeTagSupertag);

  // Local editing state: tag → current input value
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (knownTags === undefined || hierarchy === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  const supertagMap = new Map(hierarchy.map((h) => [h.tag, h.supertag]));

  function getDraft(tag: string): string {
    return drafts[tag] ?? (supertagMap.get(tag) ?? "");
  }

  async function commit(tag: string) {
    const value = getDraft(tag).trim().toLowerCase().replace(/^#/, "");
    const current = supertagMap.get(tag);
    if (value === (current ?? "")) return; // no change
    if (value === "") {
      await removeSupertag({ tag });
    } else {
      await setSupertag({ tag, supertag: value });
    }
    // Clear draft after save
    setDrafts((d) => { const next = { ...d }; delete next[tag]; return next; });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        <h1 className="text-sm font-semibold">Tags</h1>
        <p className="text-xs text-muted-foreground">
          Assign a supertag to roll a tag up in reporting. The base tag still shows on tasks.
        </p>

        {knownTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="divide-y">
            {knownTags.map((tag) => {
              const supertag = supertagMap.get(tag);
              const draft = getDraft(tag);
              return (
                <li key={tag} className="flex items-center gap-3 py-2">
                  <span className="text-sm font-medium w-28 shrink-0 truncate">#{tag}</span>
                  <span className="text-xs text-muted-foreground shrink-0">→</span>
                  <input
                    value={draft}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [tag]: e.target.value }))
                    }
                    onBlur={() => commit(tag)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.currentTarget.blur(); }
                      if (e.key === "Escape") {
                        setDrafts((d) => { const next = { ...d }; delete next[tag]; return next; });
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="supertag"
                    className="flex-1 text-sm bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                  />
                  {supertag && (
                    <button
                      onClick={() => {
                        setDrafts((d) => ({ ...d, [tag]: "" }));
                        removeSupertag({ tag });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Remove supertag"
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
