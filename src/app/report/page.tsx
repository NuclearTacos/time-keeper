"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { TaskBarChart } from "@/components/report/TaskBarChart";
import { TagDonutChart } from "@/components/report/TagDonutChart";
import { DayTimeline } from "@/components/report/DayTimeline";
import { DaysHeatmap } from "@/components/report/DaysHeatmap";
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

  const taskBarData = useMemo(
    () => (entries ? buildTaskBarData(entries) : []),
    [entries]
  );
  const colorMap = useMemo(
    () => buildColorMap(taskBarData.map((d) => d.taskId)),
    [taskBarData]
  );
  const tagDonutData = useMemo(
    () => (entries ? buildTagDonutData(entries, Date.now(), hierarchyMap) : []),
    [entries, hierarchyMap]
  );
  const totalMs = useMemo(
    () => (entries ? computeTotalMs(entries) : 0),
    [entries]
  );
  const timelineData = useMemo(
    () =>
      entries && tab === "today"
        ? buildTimelineData(entries, todayFromMs, todayToMs, Date.now(), hierarchyMap)
        : [],
    [entries, tab, todayFromMs, todayToMs, hierarchyMap]
  );
  const heatmapData = useMemo(
    () => (entries ? buildHeatmapData(entries, fromTime, toTime) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, fromTime, toTime]
  );

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

        {/* Sprint date picker */}
        {tab === "sprint" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={sprintFrom}
              max={sprintTo}
              onChange={(e) => setSprintFrom(e.target.value)}
              className="border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={sprintTo}
              min={sprintFrom}
              max={todayStr}
              onChange={(e) => setSprintTo(e.target.value)}
              className="border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        {entries === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Total */}
            <div>
              <span className="text-3xl font-semibold tabular-nums">
                {formatDuration(totalMs)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">total</span>
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
