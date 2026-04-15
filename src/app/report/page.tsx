"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { TaskBarChart } from "@/components/report/TaskBarChart";
import { TagDonutChart } from "@/components/report/TagDonutChart";
import { DayTimeline } from "@/components/report/DayTimeline";
import { DaysHeatmap } from "@/components/report/DaysHeatmap";
import { SprintPanel } from "@/components/report/SprintPanel";
import { formatDuration } from "@/lib/formatDuration";
import {
  toDateInputValue,
  startOfDay,
  endOfDay,
  startOfWeek,
} from "@/lib/dateUtils";
import {
  buildTaskBarData,
  buildTagDonutData,
  buildTimelineData,
  buildHeatmapData,
  computeTotalMs,
  type SessionEntry,
} from "@/lib/reportTransforms";
import { buildColorMap } from "@/lib/reportColors";
import { cn } from "@/lib/utils";

type Tab = "today" | "week" | "sprint";

export default function ReportPage() {
  const [tab, setTab] = useState<Tab>("today");

  const todayStr = toDateInputValue(new Date());
  const [sprintFrom, setSprintFrom] = useState(todayStr);
  const [sprintTo, setSprintTo] = useState(todayStr);

  // Filter state
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");

  const todayFromMs = startOfDay(todayStr);
  const todayToMs = endOfDay(todayStr);

  const fromTime =
    tab === "today"
      ? todayFromMs
      : tab === "week"
      ? startOfWeek(new Date())
      : startOfDay(sprintFrom);

  const toTime =
    tab === "today"
      ? todayToMs
      : tab === "week"
      ? todayToMs
      : endOfDay(sprintTo);

  const rawEntries = useQuery(api.sessions.getSessionsInRange, { fromTime, toTime });
  const entries = rawEntries as SessionEntry[] | undefined;
  const rawHierarchy = useQuery(api.tagHierarchy.getTagHierarchy);

  const hierarchyMap = useMemo(
    () => new Map((rawHierarchy ?? []).map((h) => [h.tag, h.supertag])),
    [rawHierarchy]
  );

  // All tags present in the current period (resolved through hierarchy), for filter pills
  const availableTags = useMemo(() => {
    if (!entries) return [];
    const tagSet = new Set<string>();
    for (const { task } of entries) {
      if (!task) continue;
      for (const tag of task.tags) {
        tagSet.add(hierarchyMap.get(tag) ?? tag);
      }
    }
    return [...tagSet].sort();
  }, [entries, hierarchyMap]);

  // Entries after applying active filters
  const filteredEntries = useMemo((): SessionEntry[] | undefined => {
    if (!entries) return undefined;
    let result = entries;
    const lowerSearch = filterText.trim().toLowerCase();
    if (lowerSearch) {
      result = result.filter((e) =>
        e.task?.name.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterTags.size > 0) {
      result = result.filter((e) => {
        if (!e.task) return false;
        return e.task.tags.some((t) => {
          const resolved = hierarchyMap.get(t) ?? t;
          return filterTags.has(resolved) || filterTags.has(t);
        });
      });
    }
    return result;
  }, [entries, filterText, filterTags, hierarchyMap]);

  function toggleFilterTag(tag: string) {
    setFilterTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const taskBarData = useMemo(
    () => (filteredEntries ? buildTaskBarData(filteredEntries) : []),
    [filteredEntries]
  );
  const colorMap = useMemo(
    () => buildColorMap(taskBarData.map((d) => d.taskId)),
    [taskBarData]
  );
  const tagDonutData = useMemo(
    () => (filteredEntries ? buildTagDonutData(filteredEntries, Date.now(), hierarchyMap) : []),
    [filteredEntries, hierarchyMap]
  );
  const totalMs = useMemo(
    () => (filteredEntries ? computeTotalMs(filteredEntries) : 0),
    [filteredEntries]
  );
  const timelineData = useMemo(
    () =>
      filteredEntries && tab === "today"
        ? buildTimelineData(filteredEntries, todayFromMs, todayToMs, Date.now(), hierarchyMap)
        : [],
    [filteredEntries, tab, todayFromMs, todayToMs, hierarchyMap]
  );
  const heatmapData = useMemo(
    () => (filteredEntries ? buildHeatmapData(filteredEntries, fromTime, toTime) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredEntries, fromTime, toTime]
  );

  const hasActiveFilters = filterTags.size > 0 || filterText.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-5">
        {/* Tab bar */}
        <div className="flex gap-1">
          {(["today", "week", "sprint"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                tab === t
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {t === "today" ? "Today" : t === "week" ? "This Week" : "Sprint"}
            </button>
          ))}
        </div>

        {/* Sprint selector */}
        {tab === "sprint" && (
          <SprintPanel
            sprintFrom={sprintFrom}
            sprintTo={sprintTo}
            onChange={(from, to) => { setSprintFrom(from); setSprintTo(to); }}
          />
        )}

        {entries === undefined ? (
          <div className="animate-pulse space-y-5">
            <div className="h-9 w-32 rounded bg-muted-foreground/20" />
            <div className="h-3 w-48 rounded bg-muted-foreground/10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-40 rounded bg-muted-foreground/10" />
              <div className="h-40 rounded bg-muted-foreground/10" />
            </div>
          </div>
        ) : (
          <>
            {/* Filter section */}
            <div className="space-y-2 pb-1 border-b border-border">
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground shrink-0">Tags:</span>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleFilterTag(tag)}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border transition-colors",
                        filterTags.has(tag)
                          ? "bg-foreground text-background border-transparent"
                          : "text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/50"
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                  {filterTags.size > 0 && (
                    <button
                      onClick={() => setFilterTags(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Search:</span>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter by task name…"
                  className="text-xs bg-transparent border-b border-transparent focus:border-muted-foreground/40 focus:outline-none placeholder:text-muted-foreground/40 flex-1 py-0.5 transition-colors"
                />
                {filterText && (
                  <button
                    onClick={() => setFilterText("")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Total */}
            <div>
              <span className="text-3xl font-semibold tabular-nums">
                {formatDuration(totalMs)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {hasActiveFilters ? "filtered total" : "total"}
              </span>
            </div>

            {/* Today: timeline */}
            {tab === "today" && (
              <section>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Timeline
                </h2>
                <DayTimeline
                  sessions={timelineData}
                  colorMap={colorMap}
                  dayStart={todayFromMs}
                  hierarchy={hierarchyMap}
                />
              </section>
            )}

            {/* Week / Sprint: heatmap */}
            {tab !== "today" && (
              <section>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {tab === "week" ? "This Week" : "Daily Breakdown"}
                </h2>
                <DaysHeatmap days={heatmapData} multiRow={tab === "sprint"} />
              </section>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  By Task
                </h2>
                <TaskBarChart data={taskBarData} colorMap={colorMap} />
              </section>
              <section>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  By Tag
                </h2>
                <TagDonutChart
                  data={tagDonutData}
                  totalDurationLabel={formatDuration(totalMs)}
                />
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
