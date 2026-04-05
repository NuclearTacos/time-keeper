import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTagColors = query({
  args: {},
  handler: async (ctx): Promise<Record<string, string>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};
    const entries = await ctx.db
      .query("tagColors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return Object.fromEntries(entries.map((e) => [e.tag, e.color]));
  },
});

export const setTagColor = mutation({
  args: { tag: v.string(), color: v.string() },
  handler: async (ctx, { tag, color }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("tagColors")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { color });
    } else {
      await ctx.db.insert("tagColors", { userId, tag, color });
    }
  },
});

export const removeTagColor = mutation({
  args: { tag: v.string() },
  handler: async (ctx, { tag }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("tagColors")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
