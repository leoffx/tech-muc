import { z } from "zod";

import {
  ensureTicketWorkspace,
  spawnPlanClient,
} from "~/server/agent/service";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const planRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        ticketId: z.string().min(1, "ticketId is required"),
        repoUrl: z.string().url("A valid repository URL is required"),
        branch: z.string().min(1).optional(),
        instructions: z
          .string()
          .min(1, "instructions must not be empty")
          .max(10_000, "instructions are too long"),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isSupportedGitUrl(input.repoUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "repoUrl must be an HTTPS Git repository URL ending with .git",
        });
      }

      const workspace = await ensureTicketWorkspace({
        ticketId: input.ticketId,
        repoUrl: input.repoUrl,
        branch: input.branch,
      });

      const plan = {
        ticketId: input.ticketId,
        workspacePath: workspace.workspacePath,
        steps: [
          {
            title: "Review instructions",
            detail: input.instructions,
          },
          {
            title: "Inspect repository",
            detail: `Check out ${workspace.repoUrl} on branch ${workspace.branch ?? "default"}`,
          },
          {
            title: "Prepare implementation",
            detail: "Outline coding tasks and testing strategy.",
          },
        ],
      };

      await spawnPlanClient({
        ticketId: input.ticketId,
        repoUrl: workspace.repoUrl,
        branch: workspace.branch,
        metadata: {
          purpose: "plan",
          instructions: input.instructions,
        },
      });

      return {
        plan,
        workspace,
      };
    }),
});

function isSupportedGitUrl(candidate: string) {
  try {
    const parsed = new URL(candidate);
    const hasCredentials = Boolean(parsed.username || parsed.password);
    return (
      parsed.protocol === "https:" &&
      parsed.pathname.endsWith(".git") &&
      !hasCredentials
    );
  } catch {
    return false;
  }
}
