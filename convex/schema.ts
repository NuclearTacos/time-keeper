import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  tasks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    tags: v.array(v.string()), // lowercase, no # prefix
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    activeTags: v.array(v.string()),
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
});
