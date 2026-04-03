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

  const [supertagDrafts, setSupertagDrafts] = useState<Record<string, string>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
              const supertagDraft = getSupertagDraft(tag);
              const isEditingName = editingName[tag];
              const nameDraft = nameDrafts[tag] ?? tag;

              return (
                <li key={tag} className="flex items-center gap-3 py-2">
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

                  <button
                    onClick={() => setConfirmDelete(tag)}
                    className="text-base text-muted-foreground hover:text-red-500 transition-colors shrink-0 leading-none"
                    title="Delete tag"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Delete confirmation modal */}
      {confirmDelete !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="bg-background border rounded-lg p-4 w-full max-w-xs mx-4 space-y-3 shadow-lg">
            <h2 className="text-sm font-semibold">Delete tag</h2>
            <p className="text-sm text-muted-foreground">
              Remove <span className="text-foreground font-medium">#{confirmDelete}</span> from all tasks?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                cancel
              </button>
              <button
                onClick={() => {
                  deleteTag({ tag: confirmDelete });
                  setConfirmDelete(null);
                }}
                className="text-sm border border-red-500/40 text-red-500 rounded px-3 py-1 hover:bg-red-500/10 transition-colors"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
