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
  const renameTag = useMutation(api.tasks.renameTag);
  const deleteTag = useMutation(api.tasks.deleteTag);

  // Local drafts for supertag inputs: tag → value
  const [supertagDrafts, setSupertagDrafts] = useState<Record<string, string>>({});
  // Local drafts for tag name editing: tag → value
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  // Which tag names are being edited
  const [editingName, setEditingName] = useState<Record<string, boolean>>({});

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

  function getSupertagDraft(tag: string): string {
    return supertagDrafts[tag] ?? (supertagMap.get(tag) ?? "");
  }

  async function commitSupertag(tag: string) {
    const value = getSupertagDraft(tag).trim().toLowerCase().replace(/^#/, "");
    const current = supertagMap.get(tag);
    if (value === (current ?? "")) return;
    if (value === "") {
      await removeSupertag({ tag });
    } else {
      await setSupertag({ tag, supertag: value });
    }
    setSupertagDrafts((d) => { const next = { ...d }; delete next[tag]; return next; });
  }

  async function commitRename(oldTag: string) {
    const newTag = (nameDrafts[oldTag] ?? "").trim().toLowerCase().replace(/^#/, "");
    setEditingName((e) => ({ ...e, [oldTag]: false }));
    setNameDrafts((d) => { const next = { ...d }; delete next[oldTag]; return next; });
    if (!newTag || newTag === oldTag) return;
    await renameTag({ oldTag, newTag });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        <h1 className="text-sm font-semibold">Tags</h1>
        <p className="text-xs text-muted-foreground">
          Click a tag name to rename it. Assign a supertag to roll it up in reporting.
        </p>

        {knownTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="divide-y">
            {knownTags.map((tag) => {
              const supertag = supertagMap.get(tag);
              const supertagDraft = getSupertagDraft(tag);
              const isEditingName = editingName[tag];
              const nameDraft = nameDrafts[tag] ?? tag;

              return (
                <li key={tag} className="flex items-center gap-3 py-2">
                  {/* Tag name — click to edit */}
                  {isEditingName ? (
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDrafts((d) => ({ ...d, [tag]: e.target.value }))}
                      onBlur={() => commitRename(tag)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          setEditingName((ev) => ({ ...ev, [tag]: false }));
                          setNameDrafts((d) => { const next = { ...d }; delete next[tag]; return next; });
                        }
                      }}
                      className="w-28 shrink-0 text-sm bg-transparent border-b border-foreground/40 focus:outline-none focus:border-foreground/70"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setNameDrafts((d) => ({ ...d, [tag]: tag }));
                        setEditingName((e) => ({ ...e, [tag]: true }));
                      }}
                      className="text-sm font-medium w-28 shrink-0 truncate text-left hover:text-foreground/70 transition-colors"
                      title="Click to rename"
                    >
                      #{tag}
                    </button>
                  )}

                  <span className="text-xs text-muted-foreground shrink-0">→</span>

                  {/* Supertag input */}
                  <input
                    value={supertagDraft}
                    onChange={(e) => setSupertagDrafts((d) => ({ ...d, [tag]: e.target.value }))}
                    onBlur={() => commitSupertag(tag)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setSupertagDrafts((d) => { const next = { ...d }; delete next[tag]; return next; });
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="supertag"
                    className="flex-1 text-sm bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground/40"
                  />

                  {/* Clear supertag */}
                  {supertag && (
                    <button
                      onClick={() => {
                        setSupertagDrafts((d) => ({ ...d, [tag]: "" }));
                        removeSupertag({ tag });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Remove supertag"
                    >
                      ×
                    </button>
                  )}

                  {/* Delete tag */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag #${tag} from all tasks?`)) {
                        deleteTag({ tag });
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Delete tag"
                  >
                    ␡
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
