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
});
