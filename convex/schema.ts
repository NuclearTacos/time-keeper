import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Extends the auth-provided `users` table with an admin flag. Admins are the
  // only users allowed to trigger Claude fix runs (see convex/admin.ts).
  // Grant by setting `isAdmin: true` on the user document in the Convex dashboard.
  users: defineTable({
    ...authTables.users.validator.fields,
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  tasks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    tags: v.array(v.string()), // lowercase, no # prefix
    createdAt: v.number(),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    queuedAt: v.optional(v.number()),      // epoch ms when task was added to ToDo queue
    scheduledDate: v.optional(v.string()), // YYYY-MM-DD, only meaningful while queued
  })
    .index("by_user", ["userId"])
    .index("by_user_and_queued", ["userId", "queuedAt"]),

  userSettings: defineTable({
    userId: v.id("users"),
    activeTags: v.array(v.string()),
    sprintPatternDays: v.optional(v.number()),   // e.g. 14
    sprintAnchorDate: v.optional(v.string()),    // YYYY-MM-DD, a known sprint start
  }).index("by_user", ["userId"]),

  sessions: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    startTime: v.number(), // epoch ms
    endTime: v.optional(v.number()), // absent = active session
  })
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"])
    .index("by_user_active", ["userId", "endTime"])
    .index("by_user_and_start", ["userId", "startTime"]),

  // Links between the end of one session and the start of another.
  // Created automatically when starting a new task stops the previous one.
  // When linked, bumping one boundary also moves the other.
  sessionLinks: defineTable({
    userId: v.id("users"),
    endSessionId: v.id("sessions"),   // session whose endTime is linked
    startSessionId: v.id("sessions"), // session whose startTime is linked
  })
    .index("by_user", ["userId"])
    .index("by_end_session", ["endSessionId"])
    .index("by_start_session", ["startSessionId"]),

  feedback: defineTable({
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
    resolved: v.optional(v.boolean()),
  }).index("by_created", ["createdAt"]),

  // One-level tag hierarchy: a base tag can have one supertag.
  // In reporting, subtags are rolled up to their supertag.
  tagHierarchy: defineTable({
    userId: v.id("users"),
    tag: v.string(),      // base tag (lowercase, no #)
    supertag: v.string(), // parent tag (lowercase, no #)
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tag", ["userId", "tag"]),

  tagColors: defineTable({
    userId: v.id("users"),
    tag: v.string(),   // lowercase, no #
    color: v.string(), // one of the palette color names
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tag", ["userId", "tag"]),

  sprints: defineTable({
    userId: v.id("users"),
    name: v.string(),       // e.g. "Sprint 12"
    startDate: v.string(),  // YYYY-MM-DD, inclusive
    endDate: v.string(),    // YYYY-MM-DD, inclusive
    createdAt: v.number(),  // epoch ms, for ordering
  }).index("by_user", ["userId"]),

  // Tracks when each user last viewed the What's New feed.
  whatsNewSeen: defineTable({
    userId: v.id("users"),
    lastSeenAt: v.number(), // epoch ms when user last opened the feed (kept for backward compat)
    lastSeenCount: v.optional(v.number()), // number of CHANGELOG entries visible when user last opened the feed
  }).index("by_user", ["userId"]),
});
