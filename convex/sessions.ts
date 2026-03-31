import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const limit = args.limit ?? 10;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_and_start", (q) => q.eq("userId", userId))
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
    if (activeSession) {
      await ctx.db.patch(activeSession._id, { endTime: Date.now() });
    }

    // Resolve taskId
    let taskId = args.taskId;
    if (!taskId) {
      if (!args.name) throw new Error("Must provide taskId or name");
      taskId = await ctx.db.insert("tasks", {
        userId,
        name: args.name,
        tags: args.tags ?? [],
        createdAt: Date.now(),
      });
    } else {
      const task = await ctx.db.get(taskId);
      if (!task || task.userId !== userId) throw new Error("Task not found");
    }

    return await ctx.db.insert("sessions", {
      taskId,
      userId,
      startTime: Date.now(),
    });
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
