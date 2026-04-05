import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitFeedback = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.insert("feedback", { userId, text, createdAt: Date.now() });
  },
});

// No auth required so `npx convex run feedback:listFeedback` works for Claude to read.
export const listFeedback = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("feedback")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

// No auth required so Claude can resolve feedback via HTTP endpoint.
export const resolveFeedback = mutation({
  args: { feedbackId: v.id("feedback") },
  handler: async (ctx, { feedbackId }) => {
    await ctx.db.patch(feedbackId, { resolved: true });
  },
});

// No auth required so `npx convex run feedback:clearAllFeedback` works.
export const clearAllFeedback = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("feedback").collect();
    await Promise.all(all.map((f) => ctx.db.delete(f._id)));
  },
});
