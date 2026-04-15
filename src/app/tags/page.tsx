"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { TAG_COLORS, TAG_COLOR_MAP } from "@/lib/tagColors";

export default function TagsPage() {
  const knownTags = useQuery(api.tasks.getAllUserTags);
  const hierarchy = useQuery(api.tagHierarchy.getTagHierarchy);
  const tagColors = useQuery(api.tagColors.getTagColors);
  const setSupertag = useMutation(api.tagHierarchy.setTagSupertag);
  const removeSupertag = useMutation(api.tagHierarchy.removeTagSupertag);
  const renameTag = useMutation(api.tasks.renameTag);
  const deleteTag = useMutation(api.tasks.deleteTag);
  const setTagColor = useMutation(api.tagColors.setTagColor);
  const removeTagColor = useMutation(api.tagColors.removeTagColor);

  const [supertagDrafts, setSupertagDrafts] = useState<Record<string, string>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<Record<string, boolean>>({});
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const supertagMap = new Map((hierarchy ?? []).map((h) => [h.tag, h.supertag]));

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

  function handleColorSelect(tag: string, color: string | null) {
    setColorPickerOpen(null);
    if (color === null) {
      removeTagColor({ tag });
    } else {
      setTagColor({ tag, color });
    }
  }

  return (
    <div className="min-h-screen flex flex-col" onClick={() => setColorPickerOpen(null)}>
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4">
        <h1 className="text-sm font-semibold">Tags</h1>
        <p className="text-xs text-muted-foreground">
          Click a tag name to rename it. Assign a supertag to roll it up in reporting.
        </p>

        {knownTags === undefined ? (
          <ul className="divide-y animate-pulse">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-muted-foreground/20 shrink-0" />
                <div className="h-3 rounded bg-muted-foreground/20" style={{ width: `${60 + i * 15}px` }} />
                <div className="h-3 rounded bg-muted-foreground/10 w-16 ml-auto" />
              </li>
            ))}
          </ul>
        ) : knownTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="divide-y">
            {knownTags.map((tag) => {
              const supertagDraft = getSupertagDraft(tag);
              const isEditingName = editingName[tag];
              const nameDraft = nameDrafts[tag] ?? tag;
              const currentColor = tagColors?.[tag] as string | undefined;
              const isColorOpen = colorPickerOpen === tag;

              return (
                <li key={tag} className="py-2 space-y-1.5">
                  <div className="flex items-center gap-3">
                    {/* Color swatch button */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setColorPickerOpen(isColorOpen ? null : tag)}
                        className="w-4 h-4 rounded-full border border-foreground/20 hover:border-foreground/50 transition-colors"
                        style={currentColor ? {} : undefined}
                        title="Set tag color"
                      >
                        {currentColor ? (
                          <span
                            className={`block w-full h-full rounded-full ${TAG_COLOR_MAP[currentColor as keyof typeof TAG_COLOR_MAP]?.bg ?? ""}`}
                          />
                        ) : (
                          <span className="block w-full h-full rounded-full bg-muted-foreground/20" />
                        )}
                      </button>

                      {isColorOpen && (
                        <div className="absolute left-0 top-6 z-20 bg-background border rounded-md shadow-md p-1.5 flex gap-1">
                          {/* Clear color option */}
                          <button
                            onClick={() => handleColorSelect(tag, null)}
                            className={`w-4 h-4 rounded-full border-2 bg-muted-foreground/20 transition-colors ${
                              !currentColor ? "border-foreground" : "border-transparent hover:border-foreground/40"
                            }`}
                            title="No color"
                          />
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => handleColorSelect(tag, c)}
                              className={`w-4 h-4 rounded-full border-2 ${TAG_COLOR_MAP[c].bg} transition-colors ${
                                currentColor === c ? "border-foreground" : "border-transparent hover:border-foreground/40"
                              }`}
                              title={c}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tag name */}
                    {isEditingName ? (
                      <input
                        autoFocus
                        autoCapitalize="none"
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
                        className={`text-sm font-medium w-28 shrink-0 truncate text-left hover:opacity-70 transition-opacity ${
                          currentColor ? TAG_COLOR_MAP[currentColor as keyof typeof TAG_COLOR_MAP]?.text ?? "" : ""
                        }`}
                        title="Click to rename"
                      >
                        #{tag}
                      </button>
                    )}

                    <span className="text-xs text-muted-foreground shrink-0">→</span>

                    <input
                      autoCapitalize="none"
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
                  </div>
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
