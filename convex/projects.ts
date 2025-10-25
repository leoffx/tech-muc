import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    githubRepoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("projects", {
      title: args.title,
      githubRepoUrl: args.githubRepoUrl,
    });
  },
});
