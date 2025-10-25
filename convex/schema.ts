import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tickets: defineTable({
    title: v.string(),
    description: v.string(),
    projectId: v.id("projects"),
    status: v.union(
      v.literal("todo"),
      v.literal("planning"),
      v.literal("in-progress"),
      v.literal("done"),
    ),
    author: v.id("authors"),
    conversation: v.optional(v.object({})),
  }).index("by_projectId", ["projectId"]),
  authors: defineTable({
    name: v.string(),
    imageUrl: v.string(),
  }),
  projects: defineTable({
    title: v.string(),
    githubRepoUrl: v.string(),
  }),
});
