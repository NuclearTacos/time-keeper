import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Returns the epoch ms timestamp of when the current user last viewed the
 * What's New feed, or null if they have never viewed it.
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
    return record?.lastSeenAt ?? null;
  },
});

/**
 * Records that the current user has seen all What's New entries up to now.
 * Call this when the user opens the What's New feed.
 */
export const markSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("whatsNewSeen")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    // Store the start of tomorrow (UTC) so that entries dated today are
    // considered "seen" — the unseen check uses entryDayEnd > lastSeenAt,
    // and entryDayEnd for today equals start-of-tomorrow.
    const startOfTomorrow =
      (Math.floor(Date.now() / 86400000) + 1) * 86400000;
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: startOfTomorrow });
    } else {
      await ctx.db.insert("whatsNewSeen", {
        userId,
        lastSeenAt: startOfTomorrow,
      });
    }
  },
});
