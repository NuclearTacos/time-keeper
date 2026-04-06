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

export const updateTask = mutation({
  args: { taskId: v.id("tasks"), name: v.string(), tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.taskId, { name: args.name, tags: args.tags });
  },
});

export const renameTag = mutation({
  args: { oldTag: v.string(), newTag: v.string() },
  handler: async (ctx, { oldTag, newTag }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const task of tasks) {
      if (task.tags.includes(oldTag)) {
        const newTags = task.tags.map((t) => (t === oldTag ? newTag : t));
        await ctx.db.patch(task._id, { tags: newTags });
      }
    }
    // Also migrate tagHierarchy entries
    const hier = await ctx.db
      .query("tagHierarchy")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const entry of hier) {
      if (entry.tag === oldTag) {
        await ctx.db.patch(entry._id, { tag: newTag });
      } else if (entry.supertag === oldTag) {
        await ctx.db.patch(entry._id, { supertag: newTag });
      }
    }
    // Migrate tagColors entry
    const colorEntry = await ctx.db
      .query("tagColors")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", oldTag))
      .first();
    if (colorEntry) {
      await ctx.db.patch(colorEntry._id, { tag: newTag });
    }
  },
});

export const deleteTag = mutation({
  args: { tag: v.string() },
  handler: async (ctx, { tag }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const task of tasks) {
      if (task.tags.includes(tag)) {
        await ctx.db.patch(task._id, { tags: task.tags.filter((t) => t !== tag) });
      }
    }
    // Remove tagHierarchy entries for this tag
    const hier = await ctx.db
      .query("tagHierarchy")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .collect();
    for (const entry of hier) await ctx.db.delete(entry._id);
    // Remove tagColors entry for this tag
    const colorEntry = await ctx.db
      .query("tagColors")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .first();
    if (colorEntry) await ctx.db.delete(colorEntry._id);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    // Delete all sessions for this task and their sessionLinks
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();

    for (const session of sessions) {
      const linksByEnd = await ctx.db
        .query("sessionLinks")
        .withIndex("by_end_session", (q) => q.eq("endSessionId", session._id))
        .collect();
      for (const link of linksByEnd) await ctx.db.delete(link._id);

      const linksByStart = await ctx.db
        .query("sessionLinks")
        .withIndex("by_start_session", (q) => q.eq("startSessionId", session._id))
        .collect();
      for (const link of linksByStart) await ctx.db.delete(link._id);

      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(taskId);
  },
});

export const getAllUserTags = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Build a map of taskId → tags for quick lookup
    const taskTagMap = new Map(tasks.map((t) => [t._id, t.tags]));

    // Find the most recent session startTime per tag
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user_and_start", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const tagLastUsed = new Map<string, number>();
    for (const s of sessions) {
      const tags = taskTagMap.get(s.taskId) ?? [];
      for (const tag of tags) {
        if (!tagLastUsed.has(tag)) tagLastUsed.set(tag, s.startTime);
      }
    }

    // Collect all tags (including those never used in a session)
    const allTags = new Set<string>();
    for (const task of tasks) for (const tag of task.tags) allTags.add(tag);

    return [...allTags].sort((a, b) => {
      const aTime = tagLastUsed.get(a) ?? 0;
      const bTime = tagLastUsed.get(b) ?? 0;
      if (bTime !== aTime) return bTime - aTime; // most recent first
      return a.localeCompare(b); // alphabetical tiebreak
    });
  },
});

export const updateTaskUrl = mutation({
  args: { taskId: v.id("tasks"), url: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.taskId, { url: args.url });
  },
});

export const updateTaskNotes = mutation({
  args: { taskId: v.id("tasks"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.taskId, { notes: args.notes });
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
