import { TRPCError } from "@trpc/server";
import { ConvexHttpClient } from "convex/browser";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";

import { env } from "~/env";
import {
  ensureTicketWorkspace,
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
      // if (!isSupportedGitUrl(repoUrl)) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: `Project ${project._id} does not have a valid HTTPS git URL ending with .git.`,
      //   });
      // }

      const workspace = await ensureTicketWorkspace({
        ticketId: input.ticketId,
        repoUrl,
      });

      const { systemPrompt, userPrompt } = buildPrompts({
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

      console.info(`Plan generated for ticket ${input.ticketId} in session ${planResult.client.sessionId}: ${planResult.markdown.substring(0, 100)}...`);

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

function createConvexClient() {
  return new ConvexHttpClient(env.CONVEX_URL);
}

function toTicketId(value: string): Id<"tickets"> {
  return value as Id<"tickets">;
}

function buildPrompts(input: {
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
