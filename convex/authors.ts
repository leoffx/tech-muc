import { v } from "convex/values";

import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("authors").collect();
  },
});

export const get = query({
  args: { authorId: v.id("authors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.authorId);
  },
});
