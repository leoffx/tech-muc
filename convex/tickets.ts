import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await ctx.db.query("tickets").collect();
  },
});
