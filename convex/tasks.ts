import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTask = mutation({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("tasks", {
      userId,
      name: args.name,
      tags: args.tags,
      createdAt: Date.now(),
    });
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return null;
    return task;
  },
});
