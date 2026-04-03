import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTagHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("tagHierarchy")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const setTagSupertag = mutation({
  args: { tag: v.string(), supertag: v.string() },
  handler: async (ctx, { tag, supertag }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("tagHierarchy")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { supertag });
    } else {
      await ctx.db.insert("tagHierarchy", { userId, tag, supertag });
    }
  },
});

export const removeTagSupertag = mutation({
  args: { tag: v.string() },
  handler: async (ctx, { tag }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("tagHierarchy")
      .withIndex("by_user_and_tag", (q) => q.eq("userId", userId).eq("tag", tag))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
