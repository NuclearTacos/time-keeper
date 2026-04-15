import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Returns how the current user last viewed the What's New feed.
 * - lastSeenCount: number of CHANGELOG entries that were visible when they last opened the feed.
 *   Any entries added since (i.e. at indices 0..CHANGELOG.length-lastSeenCount-1) are "new".
 *   null means the user has never opened the feed (or opened before this field was tracked).
 */
export const getLastSeenAt = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const record = await ctx.db
      .query("whatsNewSeen")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!record) return null;
    return {
      lastSeenAt: record.lastSeenAt,
      lastSeenCount: record.lastSeenCount ?? null,
    };
  },
});

/**
 * Records that the current user has seen all What's New entries.
 * Call this when the user opens the What's New feed, passing the current
 * length of the CHANGELOG array so we know exactly which entries were visible.
 */
export const markSeen = mutation({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("whatsNewSeen")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const startOfTomorrow =
      (Math.floor(Date.now() / 86400000) + 1) * 86400000;
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeenAt: startOfTomorrow,
        lastSeenCount: args.count,
      });
    } else {
      await ctx.db.insert("whatsNewSeen", {
        userId,
        lastSeenAt: startOfTomorrow,
        lastSeenCount: args.count,
      });
    }
  },
});
