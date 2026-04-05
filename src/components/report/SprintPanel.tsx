"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toDateInputValue } from "@/lib/dateUtils";
import { computeSprintFromPattern } from "../../../convex/sprints";

const DATE_INPUT_CLS =
  "border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring text-sm";

type Mode = "view" | "edit" | "create" | "pattern";

type SprintPanelProps = {
  sprintFrom: string;
  sprintTo: string;
  onChange: (from: string, to: string) => void;
};

export function SprintPanel({ sprintFrom, sprintTo, onChange }: SprintPanelProps) {
  const todayStr = toDateInputValue(new Date());

  const sprints = useQuery(api.sprints.listSprints);
  const pattern = useQuery(api.sprints.getSprintPattern);

  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);
  const deleteSprint = useMutation(api.sprints.deleteSprint);
  const setSprintPattern = useMutation(api.sprints.setSprintPattern);

  const [selectedId, setSelectedId] = useState<Id<"sprints"> | null>(null);
  const [mode, setMode] = useState<Mode>("view");

  // Create form
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState(todayStr);
  const [newEnd, setNewEnd] = useState(todayStr);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Pattern form
  const [patternDays, setPatternDays] = useState("");
  const [patternAnchor, setPatternAnchor] = useState("");

  // Auto-select once when sprints first load
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (!sprints || hasAutoSelected.current) return;
    hasAutoSelected.current = true;

    if (sprints.length === 0) {
      setMode("create");
      return;
    }

    // Prefer the sprint whose range contains today
    const current = sprints.find(
      (s) => s.startDate <= todayStr && s.endDate >= todayStr
    );
    const chosen = current ?? sprints[0];
    setSelectedId(chosen._id);
    onChange(chosen.startDate, chosen.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprints]);

  // Keep selectedId valid if the selected sprint was deleted externally
  useEffect(() => {
    if (!sprints || !selectedId) return;
    if (!sprints.find((s) => s._id === selectedId)) {
      const next = sprints[0] ?? null;
      setSelectedId(next?._id ?? null);
      if (next) onChange(next.startDate, next.endDate);
      else setMode("create");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprints]);

  // Seed pattern form when pattern data loads
  useEffect(() => {
    if (!pattern) return;
    if (pattern.patternDays) setPatternDays(String(pattern.patternDays));
    if (pattern.anchorDate) setPatternAnchor(pattern.anchorDate);
  }, [pattern]);

  const selectedSprint = sprints?.find((s) => s._id === selectedId) ?? null;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleSelect(id: Id<"sprints">) {
    const sprint = sprints?.find((s) => s._id === id);
    if (!sprint) return;
    setSelectedId(id);
    onChange(sprint.startDate, sprint.endDate);
    setMode("view");
  }

  function openEdit() {
    if (!selectedSprint) return;
    setEditName(selectedSprint.name);
    setEditStart(selectedSprint.startDate);
    setEditEnd(selectedSprint.endDate);
    setMode("edit");
  }

  function openCreate() {
    setNewName("");
    setNewStart(todayStr);
    setNewEnd(todayStr);
    setMode("create");
  }

  function openPattern() {
    setMode("pattern");
  }

  async function handleCreate() {
    const id = await createSprint({
      name: newName,
      startDate: newStart,
      endDate: newEnd,
    });
    setSelectedId(id);
    onChange(newStart, newEnd);
    setMode("view");
  }

  async function handleSaveEdit() {
    if (!selectedId) return;
    await updateSprint({
      sprintId: selectedId,
      name: editName,
      startDate: editStart,
      endDate: editEnd,
    });
    onChange(editStart, editEnd);
    setMode("view");
  }

  async function handleDelete() {
    if (!selectedId || !sprints) return;
    await deleteSprint({ sprintId: selectedId });
    const remaining = sprints.filter((s) => s._id !== selectedId);
    if (remaining.length > 0) {
      setSelectedId(remaining[0]._id);
      onChange(remaining[0].startDate, remaining[0].endDate);
      setMode("view");
    } else {
      setSelectedId(null);
      setMode("create");
    }
  }

  async function handleSavePattern() {
    const days = parseInt(patternDays, 10);
    if (!days || days < 1 || !patternAnchor) return;
    await setSprintPattern({ patternDays: days, anchorDate: patternAnchor });
    setMode("view");
  }

  // Preview of today's sprint given the current pattern form values
  const patternPreview = (() => {
    const days = parseInt(patternDays, 10);
    if (!days || days < 1 || !patternAnchor) return null;
    try {
      return computeSprintFromPattern(patternAnchor, days, todayStr);
    } catch {
      return null;
    }
  })();

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (sprints === undefined) {
    return <p className="text-sm text-muted-foreground">Loading sprints…</p>;
  }

  function sprintOptionLabel(s: { name: string; startDate: string; endDate: string }) {
    const isCurrent = s.startDate <= todayStr && s.endDate >= todayStr;
    return `${isCurrent ? "▸ " : ""}${s.name}  (${s.startDate} → ${s.endDate})`;
  }

  return (
    <div className="space-y-2 text-sm">
      {/* Top row: selector + action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {sprints.length > 0 && (
          <select
            value={selectedId ?? ""}
            onChange={(e) => handleSelect(e.target.value as Id<"sprints">)}
            className="border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring text-sm flex-1 min-w-0"
          >
            {sprints.map((s) => (
              <option key={s._id} value={s._id}>
                {sprintOptionLabel(s)}
              </option>
            ))}
          </select>
        )}

        {sprints.length === 0 && mode !== "create" && (
          <span className="text-muted-foreground">No sprints yet.</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {selectedSprint && mode !== "edit" && (
            <button
              onClick={openEdit}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Edit
            </button>
          )}
          {mode !== "create" && (
            <button
              onClick={openCreate}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              + New
            </button>
          )}
          <button
            onClick={mode === "pattern" ? () => setMode("view") : openPattern}
            className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sprint pattern settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Create form */}
      {mode === "create" && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Sprint name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={DATE_INPUT_CLS + " flex-1 min-w-0"}
          />
          <input
            type="date"
            value={newStart}
            max={newEnd}
            onChange={(e) => setNewStart(e.target.value)}
            className={DATE_INPUT_CLS}
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={newEnd}
            min={newStart}
            onChange={(e) => setNewEnd(e.target.value)}
            className={DATE_INPUT_CLS}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-1 rounded bg-foreground text-background text-sm disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            Create
          </button>
          {sprints.length > 0 && (
            <button
              onClick={() => setMode("view")}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Edit form */}
      {mode === "edit" && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className={DATE_INPUT_CLS + " flex-1 min-w-0"}
          />
          <input
            type="date"
            value={editStart}
            max={editEnd}
            onChange={(e) => setEditStart(e.target.value)}
            className={DATE_INPUT_CLS}
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={editEnd}
            min={editStart}
            onChange={(e) => setEditEnd(e.target.value)}
            className={DATE_INPUT_CLS}
          />
          <button
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
            className="px-3 py-1 rounded bg-foreground text-background text-sm disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            Save
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 rounded text-destructive hover:bg-muted transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setMode("view")}
            className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pattern form */}
      {mode === "pattern" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">Every</span>
            <input
              type="number"
              min={1}
              placeholder="14"
              value={patternDays}
              onChange={(e) => setPatternDays(e.target.value)}
              className={DATE_INPUT_CLS + " w-16"}
            />
            <span className="text-muted-foreground">days starting</span>
            <input
              type="date"
              value={patternAnchor}
              onChange={(e) => setPatternAnchor(e.target.value)}
              className={DATE_INPUT_CLS}
            />
            <button
              onClick={handleSavePattern}
              disabled={!patternDays || parseInt(patternDays, 10) < 1 || !patternAnchor}
              className="px-3 py-1 rounded bg-foreground text-background text-sm disabled:opacity-40 hover:opacity-80 transition-opacity"
            >
              Save
            </button>
            <button
              onClick={() => setMode("view")}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
          {patternPreview && (
            <p className="text-xs text-muted-foreground">
              Today falls in: <span className="text-foreground">{patternPreview.name}</span>
              {" "}({patternPreview.startDate} → {patternPreview.endDate})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
