import { createHash } from "node:crypto";
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
  spawnImplementationClient,
  spawnPlanClient,
} from "~/server/agent/service";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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

      const { systemPrompt, userPrompt } = buildPlanPrompts({
        ticket,
        project,
        workspaceRepoUrl: workspace.repoUrl,
        workspaceBranch: workspace.branch ?? null,
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
          system: systemPrompt,
          user: userPrompt,
        },
      });

      await convex.mutation(api.tickets.savePlan, {
        ticketId,
        plan: planResult.markdown,
      });

      return {
        plan: {
          ticketId: input.ticketId,
          markdown: planResult.markdown,
          sessionId: planResult.client.sessionId,
          generatedAt: new Date().toISOString(),
        },
        workspace,
      };
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

      const { systemPrompt, userPrompt } = buildImplementationPrompts({
        ticket,
        project,
        plan: ticket.plan,
        branchName,
      });

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
          system: systemPrompt,
          user: userPrompt,
        },
      });

      const finalization = await finalizeImplementationChanges({
        ticketId: input.ticketId,
        branchName,
        plan: ticket.plan,
        sessionId: implementation.client.sessionId,
        ticketTitle: ticket.title,
        projectTitle: project.title,
        baseBranch,
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
      };
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

function buildPlanPrompts(input: {
  ticket: Doc<"tickets">;
  project: Doc<"projects">;
  workspaceRepoUrl: string;
  workspaceBranch: string | null;
}) {
  const acceptanceCriteria = formatAcceptanceCriteria(input.ticket);
  const userStories =
    extractUserStoriesFromDescription(input.ticket.description) ??
    '- Derive user stories from the context so each follows "As a ..., I want ..., so that ...".';

  const contextLines = [
    `Ticket ID: ${input.ticket._id}`,
    `Title: ${input.ticket.title}`,
    `Status: ${input.ticket.status}`,
    `Project: ${input.project.title}`,
    `Repository: ${input.workspaceRepoUrl}`,
    `Branch: ${input.workspaceBranch ?? "default"}`,
  ];

  const systemPrompt = [
    "You are the planning agent for the Tech MUC engineering workspace. Craft thoughtful, pragmatic implementation plans.",
    "## Context",
    ...contextLines.map((line) => `- ${line}`),
    "",
    "### Ticket Description",
    indentBlock(input.ticket.description || "No description provided."),
    "",
    "## Acceptance Criteria",
    acceptanceCriteria,
    "",
    "## User Stories",
    userStories,
    "",
    "## Remarks",
    "- Favor incremental, verifiable steps with clear owners and entry/exit criteria.",
    "- Highlight risky areas, unknowns, or decisions that require stakeholder input.",
    "- Emphasize how and where to validate the solution (tests, experiments, manual QA).",
    "- Explicitly outline automated and manual testing you expect engineers to execute; call out gaps if testing is not feasible.",
    "- Prefer reuse of existing patterns within the codebase over introducing new abstractions.",
    "- Provide rationale for each major step so engineers and reviewers understand intent.",
  ]
    .filter((section) => section !== undefined)
    .join("\n");

  const userPrompt = [
    "Produce a Markdown implementation plan tailored to the context above.",
    "Structure the output with the following headings:",
    "1. Overview",
    "2. Key Considerations",
    "3. Implementation Steps (numbered, each with rationale and verification guidance)",
    "4. Testing Strategy",
    "5. Risks & Mitigations",
    "6. Open Questions / Follow-ups",
    "",
    "For every implementation step, reference concrete files, modules, or routes when possible and describe how success will be validated.",
    "Always dedicate the Testing Strategy section to concrete automated/manual checks; justify any missing coverage.",
    "Conclude with a succinct checklist summarizing the critical tasks.",
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
  };
}

function formatAcceptanceCriteria(ticket: Doc<"tickets">) {
  const lines = ticket.description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const sectionStart = lines.findIndex((line) =>
    /^acceptance criteria:?$/i.test(line),
  );

  let candidateLines: string[] = [];
  if (sectionStart !== -1) {
    for (let i = sectionStart + 1; i < lines.length; i += 1) {
      const current = lines[i];
      if (!current) {
        continue;
      }
      if (/^[A-Z][A-Za-z0-9\s]+:/.test(current)) {
        break;
      }
      candidateLines.push(current);
    }
  } else {
    candidateLines = lines.filter((line) => /^[-*•]/.test(line));
  }

  if (candidateLines.length === 0) {
    return "- Derive acceptance criteria from the ticket description and any linked discussion.";
  }

  return candidateLines
    .map((line) => {
      if (/^[-*•]\s*/.test(line)) {
        const normalized = line.replace(/^[-*•]\s*/, "").trim();
        return `- ${normalized}`;
      }
      return `- ${line}`;
    })
    .join("\n");
}

function extractUserStoriesFromDescription(description: string) {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const storyLines = lines.filter((line) => /^as\s+(a|an|the)\b/i.test(line));

  if (storyLines.length === 0) {
    return null;
  }

  return storyLines.map((line) => `- ${line}`).join("\n");
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
  const hash = createHash("sha256").update(ticket._id).digest("hex").slice(0, 8);
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

function buildImplementationPrompts(input: {
  ticket: Doc<"tickets">;
  project: Doc<"projects">;
  plan: string;
  branchName: string;
}) {
  const trimmedPlan = input.plan.trim();
  const planSection = trimmedPlan
    ? wrapAsCodeFence(trimmedPlan, "markdown")
    : "_No plan details were found; fail fast and request a plan._";

  const systemPrompt = [
    "You are the implementation agent for the Tech MUC engineering workspace.",
    "You must execute the approved plan exactly, highlighting any blockers before deviating.",
    "",
    "## Ticket",
    `- ID: ${input.ticket._id}`,
    `- Title: ${input.ticket.title}`,
    `- Project: ${input.project.title}`,
    `- Status: ${input.ticket.status}`,
    "",
    "## Branch Policy",
    `- Work exclusively on the branch \`${input.branchName}\`.`,
    "- Commit frequently with descriptive messages tied to plan steps.",
    "- After finishing, ensure the branch is pushed and up to date on origin.",
    "",
    "## Implementation Plan",
    planSection,
    "",
    "## Operating Principles",
    "- Follow the plan in order unless a step is blocked; flag blockers immediately.",
    "- Favor existing patterns and shared components already present in the repository.",
    "- Ensure all relevant tests are added or updated; call out missing coverage openly.",
    "- Run automated checks (unit, integration, lint, type-check) before marking work ready; if unavailable, document the verification path.",
    "- Keep code within the scope of the ticket; avoid opportunistic refactors.",
  ].join("\n");

  const userPrompt = [
    "Begin implementing the plan now:",
    "1. Re-state the immediate next action you will take.",
    "2. Execute the steps methodically, committing after meaningful progress.",
    `3. Keep the branch \`${input.branchName}\` pushed to origin using \`--force-with-lease\` only if necessary.`,
    "4. Run and report on relevant tests as you progress; explain any skipped coverage.",
    "5. Provide status updates and surface any assumptions or risks that appear.",
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
  };
}

function wrapAsCodeFence(content: string, language: string) {
  const sanitized = content.trim();
  const fenceLanguage = language ? `${language}` : "";
  return ["```" + fenceLanguage, sanitized || "(empty)", "```"].join("\n");
}

function sanitizeBaseBranch(branch: string | null) {
  if (!branch || branch.length === 0) {
    return "main";
  }
  return branch.replace(/^origin\//, "");
}
