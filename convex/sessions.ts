import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ensureSprintForTodayHelper } from "./sprints";

export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("endTime", undefined)
      )
      .first();
    if (!session) return null;
    const task = await ctx.db.get(session.taskId);
    return { session, task };
  },
});

export const getRecentTasks = query({
  args: { limit: v.optional(v.number()), startOfToday: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const limit = args.limit ?? 10;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_and_start", (q) => {
        const base = q.eq("userId", userId);
        return args.startOfToday !== undefined
          ? base.gte("startTime", args.startOfToday)
          : base;
      })
      .order("desc")
      .take(100);

    const seen = new Set<string>();
    const recent: { task: Awaited<ReturnType<typeof ctx.db.get<"tasks">>>; lastSessionStart: number }[] = [];

    for (const session of sessions) {
      const taskIdStr = session.taskId as string;
      if (seen.has(taskIdStr)) continue;
      seen.add(taskIdStr);
      const task = await ctx.db.get(session.taskId);
      if (task) {
        recent.push({ task, lastSessionStart: session.startTime });
      }
      if (recent.length >= limit) break;
    }

    return recent;
  },
});

export const getSessionsInRange = query({
  args: {
    fromTime: v.number(),
    toTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_and_start", (q) =>
        q.eq("userId", userId).gte("startTime", args.fromTime)
      )
      .filter((q) => q.lte(q.field("startTime"), args.toTime))
      .collect();

    return await Promise.all(
      sessions.map(async (session) => ({
        session,
        task: await ctx.db.get(session.taskId),
      }))
    );
  },
});

export const startSession = mutation({
  args: {
    taskId: v.optional(v.id("tasks")),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Stop any active session
    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("endTime", undefined)
      )
      .first();
    const now = Date.now();
    if (activeSession) {
      await ctx.db.patch(activeSession._id, { endTime: now });
    }

    // Resolve taskId
    let taskId = args.taskId;
    if (!taskId) {
      if (!args.name) throw new Error("Must provide taskId or name");
      taskId = await ctx.db.insert("tasks", {
        userId,
        name: args.name,
        tags: args.tags ?? [],
        createdAt: now,
      });
    } else {
      const task = await ctx.db.get(taskId);
      if (!task || task.userId !== userId) throw new Error("Task not found");
    }

    const newSessionId = await ctx.db.insert("sessions", {
      taskId,
      userId,
      startTime: now,
    });

    // Create an explicit link between the stopped session and the new one
    if (activeSession) {
      await ctx.db.insert("sessionLinks", {
        userId,
        endSessionId: activeSession._id,
        startSessionId: newSessionId,
      });
    }

    // Auto-create a sprint for today if a pattern is configured and none exists
    await ensureSprintForTodayHelper(ctx, userId);

    return newSessionId;
  },
});

export const adjustSessionTime = mutation({
  args: {
    sessionId: v.id("sessions"),
    boundary: v.union(v.literal("start"), v.literal("end")),
    deltaMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    const deltaMs = args.deltaMinutes * 60_000;

    if (args.boundary === "start") {
      const newStart = session.startTime + deltaMs;
      // If this start is linked, move the partner's end by the same delta
      const link = await ctx.db
        .query("sessionLinks")
        .withIndex("by_start_session", (q) => q.eq("startSessionId", args.sessionId))
        .first();
      if (link) {
        const partner = await ctx.db.get(link.endSessionId);
        if (partner && partner.endTime !== undefined) {
          await ctx.db.patch(link.endSessionId, { endTime: partner.endTime + deltaMs });
        }
      }
      await ctx.db.patch(args.sessionId, { startTime: newStart });
    } else {
      if (session.endTime === undefined) throw new Error("Active session has no end time");
      const newEnd = session.endTime + deltaMs;
      // If this end is linked, move the partner's start by the same delta
      const link = await ctx.db
        .query("sessionLinks")
        .withIndex("by_end_session", (q) => q.eq("endSessionId", args.sessionId))
        .first();
      if (link) {
        const partner = await ctx.db.get(link.startSessionId);
        if (partner) {
          await ctx.db.patch(link.startSessionId, { startTime: partner.startTime + deltaMs });
        }
      }
      await ctx.db.patch(args.sessionId, { endTime: newEnd });
    }
  },
});

export const setSessionTime = mutation({
  args: {
    sessionId: v.id("sessions"),
    boundary: v.union(v.literal("start"), v.literal("end")),
    newTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    if (args.boundary === "start") {
      const deltaMs = args.newTime - session.startTime;
      const link = await ctx.db
        .query("sessionLinks")
        .withIndex("by_start_session", (q) => q.eq("startSessionId", args.sessionId))
        .first();
      if (link) {
        const partner = await ctx.db.get(link.endSessionId);
        if (partner && partner.endTime !== undefined) {
          await ctx.db.patch(link.endSessionId, { endTime: partner.endTime + deltaMs });
        }
      }
      await ctx.db.patch(args.sessionId, { startTime: args.newTime });
    } else {
      if (session.endTime === undefined) throw new Error("Active session has no end time");
      const deltaMs = args.newTime - session.endTime;
      const link = await ctx.db
        .query("sessionLinks")
        .withIndex("by_end_session", (q) => q.eq("endSessionId", args.sessionId))
        .first();
      if (link) {
        const partner = await ctx.db.get(link.startSessionId);
        if (partner) {
          await ctx.db.patch(link.startSessionId, { startTime: partner.startTime + deltaMs });
        }
      }
      await ctx.db.patch(args.sessionId, { endTime: args.newTime });
    }
  },
});

export const getLinksInRange = query({
  args: { fromTime: v.number(), toTime: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_and_start", (q) =>
        q.eq("userId", userId).gte("startTime", args.fromTime)
      )
      .filter((q) => q.lte(q.field("startTime"), args.toTime))
      .collect();

    const sessionIdSet = new Set(sessions.map((s) => s._id as string));

    const allLinks = await ctx.db
      .query("sessionLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return allLinks.filter(
      (l) =>
        sessionIdSet.has(l.endSessionId as string) ||
        sessionIdSet.has(l.startSessionId as string)
    );
  },
});

export const createSessionLink = mutation({
  args: {
    endSessionId: v.id("sessions"),
    startSessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify ownership
    const endSession = await ctx.db.get(args.endSessionId);
    const startSession = await ctx.db.get(args.startSessionId);
    if (!endSession || endSession.userId !== userId) throw new Error("Session not found");
    if (!startSession || startSession.userId !== userId) throw new Error("Session not found");

    // Remove any existing links for these boundaries first
    const existingByEnd = await ctx.db
      .query("sessionLinks")
      .withIndex("by_end_session", (q) => q.eq("endSessionId", args.endSessionId))
      .first();
    if (existingByEnd) await ctx.db.delete(existingByEnd._id);

    const existingByStart = await ctx.db
      .query("sessionLinks")
      .withIndex("by_start_session", (q) => q.eq("startSessionId", args.startSessionId))
      .first();
    if (existingByStart) await ctx.db.delete(existingByStart._id);

    return await ctx.db.insert("sessionLinks", {
      userId,
      endSessionId: args.endSessionId,
      startSessionId: args.startSessionId,
    });
  },
});

export const deleteSessionLink = mutation({
  args: { linkId: v.id("sessionLinks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const link = await ctx.db.get(args.linkId);
    if (!link || link.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.linkId);
  },
});

export const stopActiveSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("endTime", undefined)
      )
      .first();

    if (activeSession) {
      await ctx.db.patch(activeSession._id, { endTime: Date.now() });
    }
    return null;
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    // Delete any sessionLinks referencing this session
    const linksByEnd = await ctx.db
      .query("sessionLinks")
      .withIndex("by_end_session", (q) => q.eq("endSessionId", sessionId))
      .collect();
    for (const link of linksByEnd) await ctx.db.delete(link._id);

    const linksByStart = await ctx.db
      .query("sessionLinks")
      .withIndex("by_start_session", (q) => q.eq("startSessionId", sessionId))
      .collect();
    for (const link of linksByStart) await ctx.db.delete(link._id);

    await ctx.db.delete(sessionId);
  },
});
