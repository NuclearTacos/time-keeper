import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Sprint CRUD
// ---------------------------------------------------------------------------

export const listSprints = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("sprints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const createSprint = mutation({
  args: {
    name: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("sprints", {
      userId,
      name: args.name.trim(),
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: Date.now(),
    });
  },
});

export const updateSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint || sprint.userId !== userId) throw new Error("Not found");
    const patch: Partial<{ name: string; startDate: string; endDate: string }> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.startDate !== undefined) patch.startDate = args.startDate;
    if (args.endDate !== undefined) patch.endDate = args.endDate;
    await ctx.db.patch(args.sprintId, patch);
  },
});

export const deleteSprint = mutation({
  args: { sprintId: v.id("sprints") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint || sprint.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.sprintId);
  },
});

// ---------------------------------------------------------------------------
// Sprint pattern (stored in userSettings)
// ---------------------------------------------------------------------------

export const getSprintPattern = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return {
      patternDays: settings?.sprintPatternDays ?? null,
      anchorDate: settings?.sprintAnchorDate ?? null,
    };
  },
});

export const setSprintPattern = mutation({
  args: { patternDays: v.number(), anchorDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        sprintPatternDays: args.patternDays,
        sprintAnchorDate: args.anchorDate,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        activeTags: [],
        sprintPatternDays: args.patternDays,
        sprintAnchorDate: args.anchorDate,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Auto-creation helper — called from sessions.ts startSession
// ---------------------------------------------------------------------------

export async function ensureSprintForTodayHelper(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  const patternDays = settings?.sprintPatternDays;
  const anchorDate = settings?.sprintAnchorDate;
  if (!patternDays || !anchorDate) return; // no pattern configured — skip

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const existing = await ctx.db
    .query("sprints")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) =>
      q.and(
        q.lte(q.field("startDate"), todayStr),
        q.gte(q.field("endDate"), todayStr)
      )
    )
    .first();
  if (existing) return; // sprint already covers today

  const { startDate, endDate, name } = computeSprintFromPattern(
    anchorDate,
    patternDays,
    todayStr
  );
  await ctx.db.insert("sprints", {
    userId,
    name,
    startDate,
    endDate,
    createdAt: Date.now(),
  });
}

// Pure computation: given an anchor date and sprint length, find which sprint
// period contains targetDate and return its bounds + an auto-generated name.
export function computeSprintFromPattern(
  anchorDate: string,
  patternDays: number,
  targetDate: string
): { startDate: string; endDate: string; name: string } {
  const anchorMs = new Date(anchorDate + "T00:00:00Z").getTime();
  const targetMs = new Date(targetDate + "T00:00:00Z").getTime();
  const diffDays = Math.floor((targetMs - anchorMs) / 86400000);
  const sprintIndex = Math.floor(diffDays / patternDays);
  const startMs = anchorMs + sprintIndex * patternDays * 86400000;
  const endMs = startMs + (patternDays - 1) * 86400000;
  return {
    startDate: new Date(startMs).toISOString().slice(0, 10),
    endDate: new Date(endMs).toISOString().slice(0, 10),
    name: `Sprint ${sprintIndex + 1}`,
  };
}
