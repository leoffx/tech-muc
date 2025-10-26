import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { TRPCError } from "@trpc/server";
import { ConvexHttpClient } from "convex/browser";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";

import { env } from "~/env";
import {
  ensureTicketWorkspace,
  getTicketWorkspace,
  finalizeImplementationChanges,
  prepareImplementationBranch,
  removeOpencodeArtifacts,
  spawnImplementationClient,
  spawnPlanClient,
  subscribeToLogs,
} from "~/server/agent/service";
import { createWorkspaceOpencodeInstance } from "~/server/agent/opencode";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { findSimilarTasks, storeTask } from "~/server/weaviate/service";
import { getCachedPlan, setCachedPlan } from "~/server/agent/plan-cache";

function loadPlanPrompt() {
  return readFileSync(
    new URL(`../../agent/prompts/plan-system.md`, import.meta.url),
    "utf8",
  ).trim();
}

function loadImplPrompt() {
  return readFileSync(
    new URL(`../../agent/prompts/implementation-system.md`, import.meta.url),
    "utf8",
  ).trim();
}

const promptTemplates = Object.freeze({
  plan: loadPlanPrompt(),
  implementation: loadImplPrompt(),
});

export const planRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        ticketId: z.string().min(1, "ticketId is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const convex = createConvexClient();
      const ticketId = toTicketId(input.ticketId);

      // Check if we have a cached plan for this ticket
      const cachedPlan = getCachedPlan(input.ticketId);
      if (cachedPlan) {
        console.info("[PlanRouter] Serving cached plan for ticket", {
          ticketId: input.ticketId,
        });

        await convex
          .mutation(api.tickets.updateAgentStatus, {
            ticketId,
            agentStatus: "planning",
          })
          .catch((error) => {
            console.error(
              "[PlanRouter] Failed to update ticket plan from cache",
              {
                ticketId: input.ticketId,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          });

        // Schedule DB update after 5 seconds
        setTimeout(() => {
          convex
            .mutation(api.tickets.savePlan, {
              ticketId,
              plan: cachedPlan.markdown,
            })
            .catch((error) => {
              console.error(
                "[PlanRouter] Failed to update ticket plan from cache",
                {
                  ticketId: input.ticketId,
                  error: error instanceof Error ? error.message : String(error),
                },
              );
            });
          convex
            .mutation(api.tickets.updateAgentStatus, {
              ticketId,
              agentStatus: "completed",
            })
            .catch((error) => {
              console.error(
                "[PlanRouter] Failed to update ticket plan from cache",
                {
                  ticketId: input.ticketId,
                  error: error instanceof Error ? error.message : String(error),
                },
              );
            });
        }, 5000);

        return {
          plan: {
            ticketId: input.ticketId,
            markdown: cachedPlan.markdown,
            sessionId: cachedPlan.sessionId,
            generatedAt: cachedPlan.generatedAt,
          },
          workspace: cachedPlan.workspace,
        };
      }

      const ticket = await convex.query(api.tickets.get, {
        ticketId,
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No ticket found for id ${input.ticketId}`,
        });
      }

      const project = await convex.query(api.projects.get, {
        projectId: ticket.projectId,
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Ticket ${input.ticketId} is linked to a missing project (${ticket.projectId}).`,
        });
      }

      await convex.mutation(api.tickets.updateAgentStatus, {
        ticketId,
        agentStatus: "planning",
      });

      const repoUrl = project.githubRepoUrl;
      if (!isSupportedGitUrl(repoUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Project ${project._id} does not have a valid HTTPS git URL ending with .git.`,
        });
      }

      const workspace = await ensureTicketWorkspace({
        ticketId: input.ticketId,
        repoUrl,
      });

      // Query Weaviate for similar tasks
      const similarTasks = await findSimilarTasks(
        ticket.description ?? ticket.title,
        5,
        0.75,
      );

      const userPrompt = buildPlanPrompt({
        ticket,
        project,
        workspaceRepoUrl: workspace.repoUrl,
        workspaceBranch: workspace.branch ?? null,
        similarTasks,
      });

      console.info("[PlanRouter] Generating plan for ticket", {
        ticketId: input.ticketId,
        userPrompt: userPrompt,
      });

      const opencodeInstance = await createWorkspaceOpencodeInstance(
        workspace.workspacePath,
      );
      try {
        subscribeToLogs(opencodeInstance.client).catch((error) => {
          console.error(
            "[PlanRouter] Failed to subscribe to opencode logs for planning",
            {
              ticketId: input.ticketId,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        });
        const planResult = await spawnPlanClient({
          ticketId: input.ticketId,
          repoUrl: workspace.repoUrl,
          branch: workspace.branch,
          metadata: {
            purpose: "plan",
            ticketId: input.ticketId,
            repoUrl: workspace.repoUrl,
            branch: workspace.branch ?? null,
            projectId: project._id,
            projectTitle: project.title,
          },
          prompt: {
            system: promptTemplates.plan,
            user: userPrompt,
          },
          opencode: opencodeInstance.client,
        });

        console.log("[PlanRouter] Generated plan for ticket", planResult);

        await convex.mutation(api.tickets.savePlan, {
          ticketId,
          plan: planResult.markdown,
        });

        // Store task in Weaviate for future similarity searches
        await storeTask({
          ticketId: input.ticketId,
          title: ticket.title,
          description: ticket.description ?? "",
          plan: planResult.markdown,
          projectId: project._id,
          projectTitle: project.title,
          createdAt: new Date().toISOString(),
        }).catch((error) => {
          console.error("[PlanRouter] Failed to store task in Weaviate", {
            ticketId: input.ticketId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

        // Set agent status to completed after successful plan generation
        await convex.mutation(api.tickets.updateAgentStatus, {
          ticketId,
          agentStatus: "completed",
        });

        const result = {
          plan: {
            ticketId: input.ticketId,
            markdown: planResult.markdown,
            sessionId: planResult.client.sessionId,
            generatedAt: new Date().toISOString(),
          },
          workspace,
        };

        // Cache the plan for future requests
        setCachedPlan({
          ticketId: input.ticketId,
          markdown: planResult.markdown,
          sessionId: planResult.client.sessionId,
          generatedAt: result.plan.generatedAt,
          workspace: {
            workspacePath: workspace.workspacePath,
            repoUrl: workspace.repoUrl,
            branch: workspace.branch ?? null,
          },
        });

        return result;
      } catch (error) {
        // Set agent status to failed on error
        await convex
          .mutation(api.tickets.updateAgentStatus, {
            ticketId,
            agentStatus: "failed",
          })
          .catch((updateError) => {
            console.warn(
              "[PlanRouter] Failed to update agent status to failed",
              {
                ticketId: input.ticketId,
                error:
                  updateError instanceof Error
                    ? updateError.message
                    : String(updateError),
              },
            );
          });
        throw error;
      } finally {
        opencodeInstance.close();
        await removeOpencodeArtifacts(workspace.workspacePath).catch(
          (error) => {
            console.warn("[PlanRouter] Failed to cleanup opencode artifacts", {
              workspacePath: workspace.workspacePath,
              error: error instanceof Error ? error.message : String(error),
            });
          },
        );
      }
    }),
  implement: publicProcedure
    .input(
      z.object({
        ticketId: z.string().min(1, "ticketId is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const convex = createConvexClient();
      const ticketId = toTicketId(input.ticketId);
      const ticket = await convex.query(api.tickets.get, {
        ticketId,
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No ticket found for id ${input.ticketId}`,
        });
      }

      if (!ticket.plan) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Ticket ${input.ticketId} does not have a saved plan yet.`,
        });
      }

      const project = await convex.query(api.projects.get, {
        projectId: ticket.projectId,
      });

      if (!project) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Ticket ${input.ticketId} is linked to a missing project (${ticket.projectId}).`,
        });
      }

      const repoUrl = project.githubRepoUrl;
      if (!isSupportedGitUrl(repoUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Project ${project._id} does not have a valid HTTPS git URL ending with .git.`,
        });
      }

      await convex.mutation(api.tickets.updateAgentStatus, {
        ticketId,
        agentStatus: "implementing",
      });

      const workspace = await ensureTicketWorkspace({
        ticketId: input.ticketId,
        repoUrl,
      });

      const branchName = createImplementationBranchName(ticket);
      const preparedWorkspace = await prepareImplementationBranch({
        ticketId: input.ticketId,
        branchName,
        baseRef: workspace.branch ?? undefined,
      });
      const baseBranch = sanitizeBaseBranch(preparedWorkspace.branch ?? null);

      const { system, user } = buildImplementationPrompt({
        ticket,
        project,
        plan: ticket.plan,
        branchName,
      });

      const opencodeInstance = await createWorkspaceOpencodeInstance(
        workspace.workspacePath,
      );
      try {
        const implementation = await spawnImplementationClient({
          ticketId: input.ticketId,
          repoUrl: workspace.repoUrl,
          branch: branchName,
          metadata: {
            purpose: "implementation",
            ticketId: input.ticketId,
            repoUrl: workspace.repoUrl,
            branch: branchName,
            projectId: project._id,
            projectTitle: project.title,
            baseBranch,
          },
          prompt: {
            system,
            user,
          },
          opencode: opencodeInstance.client,
        });

        const finalization = await finalizeImplementationChanges({
          ticketId: input.ticketId,
          branchName,
          plan: ticket.plan,
          sessionId: implementation.client.sessionId,
          ticketTitle: ticket.title,
          projectTitle: project.title,
          projectId: project._id,
          baseBranch,
          opencode: opencodeInstance.client,
        }).catch((error: unknown) => {
          console.error("[PlanRouter] Failed to finalize implementation", {
            ticketId: input.ticketId,
            branchName,
            error: error instanceof Error ? error.message : String(error),
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Unable to finalize implementation changes.",
          });
        });

        const refreshedWorkspace = await getTicketWorkspace(input.ticketId);

        // Update pullRequestUrl if a PR was created/retrieved
        if (finalization.pullRequest?.url) {
          await convex.mutation(api.tickets.updatePullRequestUrl, {
            ticketId,
            pullRequestUrl: finalization.pullRequest.url,
          });
        }

        if (finalization.preview?.commitUrl) {
          console.info("[PlanRouter] Preview deployment completed", {
            ticketId: input.ticketId,
            commitUrl: finalization.preview.commitUrl,
            latestUrl: finalization.preview.latestUrl ?? null,
          });
        }

        // Set agent status to completed after successful implementation
        await convex.mutation(api.tickets.updateAgentStatus, {
          ticketId,
          agentStatus: "completed",
        });

        if (finalization.preview?.latestUrl) {
          await convex.mutation(api.tickets.updatePreviewUrl, {
            ticketId,
            previewUrl: finalization.preview.latestUrl,
          });
        }

        return {
          ticketId: input.ticketId,
          branch: branchName,
          plan: ticket.plan,
          sessionId: implementation.client.sessionId,
          workspace: refreshedWorkspace ?? workspace,
          acknowledgement: implementation.initialResponse ?? null,
          changes: {
            status: finalization.statusSummary,
            diffStat: finalization.diffStat,
          },
          commit: finalization.commit,
          pullRequest: finalization.pullRequest,
          preview: finalization.preview,
        };
      } catch (error) {
        // Set agent status to failed on error
        await convex
          .mutation(api.tickets.updateAgentStatus, {
            ticketId,
            agentStatus: "failed",
          })
          .catch((updateError) => {
            console.warn(
              "[PlanRouter] Failed to update agent status to failed",
              {
                ticketId: input.ticketId,
                error:
                  updateError instanceof Error
                    ? updateError.message
                    : String(updateError),
              },
            );
          });
        throw error;
      } finally {
        opencodeInstance.close();
        await removeOpencodeArtifacts(workspace.workspacePath).catch(
          (error) => {
            console.warn("[PlanRouter] Failed to cleanup opencode artifacts", {
              workspacePath: workspace.workspacePath,
              error: error instanceof Error ? error.message : String(error),
            });
          },
        );
      }
    }),
});

function isSupportedGitUrl(candidate: string) {
  if (candidate.startsWith("git@")) {
    return /^[\w.-]+@[\w.-]+:[\w./-]+\.git$/.test(candidate);
  }

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

function createConvexClient() {
  const url = env.CONVEX_URL;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

function toTicketId(value: string): Id<"tickets"> {
  return value as Id<"tickets">;
}

function buildPlanPrompt(input: {
  ticket: Doc<"tickets">;
  project: Doc<"projects">;
  workspaceRepoUrl: string;
  workspaceBranch: string | null;
  similarTasks?: Array<{
    title: string;
    description: string;
    plan?: string;
    similarity: number;
  }>;
}) {
  const contextLines = [
    `Ticket ID: ${input.ticket._id}`,
    `Title: ${input.ticket.title}`,
    `Status: ${input.ticket.status}`,
    `Project: ${input.project.title}`,
    `Repository: ${input.workspaceRepoUrl}`,
    `Branch: ${input.workspaceBranch ?? "default"}`,
  ];

  const sections = [
    "## Context",
    ...contextLines.map((line) => `- ${line}`),
    "",
    "### Ticket Description",
    indentBlock(input.ticket.description ?? "No description provided."),
    "",
  ];

  if (input.similarTasks && input.similarTasks.length > 0) {
    sections.push("### Similar Tasks from History");
    sections.push(
      "The following similar tasks have been completed in the past. Use them as reference for planning:",
      "",
    );
    input.similarTasks.forEach((task, index) => {
      sections.push(
        `#### Similar Task ${index + 1} (${Math.round(task.similarity * 100)}% match)`,
      );
      sections.push(`**Title:** ${task.title}`);
      sections.push(`**Description:** ${task.description}`);
      if (task.plan) {
        sections.push("**Plan:**");
        sections.push(indentBlock(task.plan));
      }
      sections.push("");
    });
  }

  return sections.join("\n");
}

function indentBlock(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim().length > 0 ? `> ${line}` : ">"))
    .join("\n");
}

function createImplementationBranchName(ticket: Doc<"tickets">) {
  const baseTitle = ticket.title ?? "ticket";
  const slug = slugify(baseTitle, 40);
  const hash = createHash("sha256")
    .update(ticket._id)
    .digest("hex")
    .slice(0, 8);
  return `ticket/${slug}-${hash}`;
}

function sanitizeBranchSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function slugify(value: string, maxLength: number) {
  const sanitized = sanitizeBranchSegment(value);
  if (sanitized.length <= maxLength) {
    return sanitized || "ticket";
  }
  return sanitized.slice(0, maxLength).replace(/-+$/g, "");
}

function buildImplementationPrompt(input: {
  ticket: Doc<"tickets">;
  project: Doc<"projects">;
  plan: string;
  branchName: string;
}) {
  const systemPrompt = renderTemplate(promptTemplates.implementation, {
    DYNAMIC_CONTENT: "",
    BRANCH_NAME: input.branchName,
  });

  const userPrompt = input.plan.trim();

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

function sanitizeBaseBranch(branch: string | null) {
  if (!branch || branch.length === 0) {
    return "main";
  }
  return branch.replace(/^origin\//, "");
}

function renderTemplate(
  template: string,
  replacements: Record<string, string>,
) {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return acc.replace(pattern, value);
  }, template);
}
