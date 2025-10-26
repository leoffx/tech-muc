import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const statusEnum = v.union(
  v.literal("todo"),
  v.literal("planning"),
  v.literal("in-progress"),
  v.literal("done"),
);

export const get = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    projectId: v.id("projects"),
    authorId: v.id("authors"),
    status: statusEnum,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      status: args.status,
      author: args.authorId,
    });
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: statusEnum,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { status: args.status });
  },
});

export const savePlan = mutation({
  args: {
    ticketId: v.id("tickets"),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      plan: args.plan,
    });
  },
});

const agentStatusEnum = v.union(
  v.literal("not-started"),
  v.literal("planning"),
  v.literal("implementing"),
  v.literal("completed"),
  v.literal("failed"),
);

export const updateAgentStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    agentStatus: agentStatusEnum,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { agentStatus: args.agentStatus });
  },
});

export const updatePreviewUrl = mutation({
  args: {
    ticketId: v.id("tickets"),
    previewUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { previewUrl: args.previewUrl });
  },
});

export const updatePullRequestUrl = mutation({
  args: {
    ticketId: v.id("tickets"),
    pullRequestUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { pullRequestUrl: args.pullRequestUrl });
  },
});
