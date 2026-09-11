import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Admin permission is a flag on the user document (`users.isAdmin`). It is the
 * sole source of truth — there is no email allowlist or env-var fallback.
 *
 * To grant admin to a user, set `isAdmin: true` on their document in the Convex
 * dashboard (Data > users). Everything is fail-closed: a user without the flag
 * is not an admin.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  return user?.isAdmin === true;
}

/** Throws unless the calling user is an admin. Use to guard privileged mutations. */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  if (!(await isAdmin(ctx))) {
    throw new Error("Not authorized: admin permission required");
  }
}

/**
 * Whether the calling user is an admin. Used by the UI to hide admin-only
 * controls, and by /api/fix to authorize Claude fix runs.
 */
export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => await isAdmin(ctx),
});
