import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    OPENAI_API_KEY: z.string().min(1),
    OPENCODE_MODEL: z.string().default("openai/gpt-5-codex"),
    OPENCODE_ENDPOINT: z.string().url().optional(),
    CONVEX_URL: z.string().url(),
    GH_TOKEN: z.string().min(1).optional(),
    PREVIEW_BUCKET: z.string().min(1).default("tech-munich"),
    PREVIEW_REGION: z.string().min(1).default("eu-central-1"),
    PREVIEW_WEBSITE_BASE_URL: z.string().url().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENCODE_MODEL: process.env.OPENCODE_MODEL,
    OPENCODE_ENDPOINT: process.env.OPENCODE_ENDPOINT,
    CONVEX_URL:
      process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
    GH_TOKEN: process.env.GH_TOKEN,
    PREVIEW_BUCKET: process.env.PREVIEW_BUCKET,
    PREVIEW_REGION: process.env.PREVIEW_REGION,
    PREVIEW_WEBSITE_BASE_URL: process.env.PREVIEW_WEBSITE_BASE_URL,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
