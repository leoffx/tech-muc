import type { OpencodeClient } from "@opencode-ai/sdk";
import { rm, stat } from "node:fs/promises";
import { agentEnvironmentManager } from "~/server/agent/workspace-manager";
import type { AgentClientDescriptor } from "~/server/agent/workspace-manager";

export interface EnsureTicketWorkspaceOptions {
  ticketId: string;
  repoUrl: string;
  branch?: string;
}

export interface SpawnTicketClientOptions {
  ticketId: string;
  repoUrl?: string;
  branch?: string;
  metadata?: Record<string, unknown>;
}

export interface SpawnPlanClientOptions extends SpawnTicketClientOptions {
  prompt: {
    system: string;
  };
  opencode: OpencodeClient;
}

export interface SpawnPlanResult {
  client: AgentClientDescriptor;
  markdown: string;
}

export interface SpawnImplementationClientOptions
  extends SpawnTicketClientOptions {
  prompt?: {
    system: string;
  };
  opencode: OpencodeClient;
}

export interface SpawnImplementationResult {
  client: AgentClientDescriptor;
  initialResponse?: string;
}

export async function ensureTicketWorkspace(
  options: EnsureTicketWorkspaceOptions,
) {
  const workspace = await agentEnvironmentManager.ensureWorkspace(options);
  return workspace.toDescriptor();
}

export async function getTicketWorkspace(ticketId: string) {
  const workspace = await agentEnvironmentManager.getWorkspace(ticketId);
  return workspace?.toDescriptor() ?? null;
}

export async function listTicketClients(ticketId: string) {
  return agentEnvironmentManager.listClients(ticketId);
}

export async function prepareImplementationBranch(options: {
  ticketId: string;
  branchName: string;
  baseRef?: string;
}) {
  const workspace = await agentEnvironmentManager.prepareImplementationBranch(
    options.ticketId,
    {
      branchName: options.branchName,
      baseRef: options.baseRef,
    },
  );
  return workspace.toDescriptor();
}

export async function finalizeImplementationChanges(options: {
  ticketId: string;
  branchName: string;
  plan: string;
  sessionId: string;
  ticketTitle: string;
  projectTitle: string;
  baseBranch: string;
  opencode: OpencodeClient;
}) {
  const workspace = await agentEnvironmentManager.getWorkspace(
    options.ticketId,
  );
  if (!workspace) {
    throw new Error(
      "Workspace not prepared for ticket; call ensureTicketWorkspace first.",
    );
  }

  const statusSummary = await workspace.getStatusSummary();
  const diffStat = await workspace.getDiffStat();

  console.info("[Implementation] Workspace change summary", {
    ticketId: options.ticketId,
    branchName: options.branchName,
    statusSummary,
    diffStat,
  });

  const hasChanges = await workspace.hasUncommittedChanges();
  if (!hasChanges) {
    throw new Error("Implementation produced no changes to commit.");
  }

  await removeOpencodeArtifacts(workspace.workspacePath);

  await workspace.stageAllChanges();

  const commitMessage = await generateCommitMessage({
    sessionId: options.sessionId,
    plan: options.plan,
    statusSummary,
    diffStat,
    branchName: options.branchName,
    ticketTitle: options.ticketTitle,
    projectTitle: options.projectTitle,
    ticketId: options.ticketId,
    directory: workspace.workspacePath,
    opencode: options.opencode,
  });

  const commitSha = await workspace.commitStagedChanges(commitMessage);
  await workspace.pushCurrentBranch();

  const prSummary = await generatePullRequestDescription({
    sessionId: options.sessionId,
    plan: options.plan,
    statusSummary,
    diffStat,
    commitMessage,
    ticketTitle: options.ticketTitle,
    projectTitle: options.projectTitle,
    baseBranch: options.baseBranch,
    directory: workspace.workspacePath,
    opencode: options.opencode,
  });

  const pullRequest = await workspace.ensurePullRequest({
    branchName: options.branchName,
    baseBranch: options.baseBranch,
    title: commitMessage,
    body: prSummary,
  });

  return {
    statusSummary,
    diffStat,
    commit: {
      message: commitMessage,
      sha: commitSha,
    },
    pullRequest: pullRequest ?? null,
  };
}

export async function spawnPlanClient(
  options: SpawnPlanClientOptions,
): Promise<SpawnPlanResult> {
  const { prompt, ...spawnOptions } = options;

  const client = await agentEnvironmentManager.spawnClient({
    ...spawnOptions,
    role: "plan",
    opencode: options.opencode,
  });

  const response = await options.opencode.session.prompt({
    path: {
      id: client.sessionId,
    },
    query: {
      directory: client.workspacePath,
    },
    body: {
      system: prompt.system,
      parts: prompt.user
        ? [
            {
              type: "text",
              text: prompt.user,
            },
          ]
        : [],
    },
    throwOnError: true,
  });

  const markdown = extractTextFromPromptResponse(
    response,
    "Plan generation did not return any content",
  );

  return {
    client,
    markdown,
  };
}

export async function spawnImplementationClient(
  options: SpawnImplementationClientOptions,
): Promise<SpawnImplementationResult> {
  const { prompt, ...spawnOptions } = options;

  const client = await agentEnvironmentManager.spawnClient({
    ...spawnOptions,
    role: "implementation",
    opencode: options.opencode,
  });

  if (!prompt) {
    return {
      client,
    };
  }

  const response = await options.opencode.session.prompt({
    path: {
      id: client.sessionId,
    },
    query: {
      directory: client.workspacePath,
    },
    body: {
      system: prompt.system,
      parts: prompt.user
        ? [
            {
              type: "text",
              text: prompt.user,
            },
          ]
        : [],
    },
    throwOnError: true,
  });

  const acknowledgement = extractTextFromPromptResponse(
    response,
    "Implementation agent did not acknowledge instructions.",
  );

  return {
    client,
    initialResponse: acknowledgement,
  };
}

function extractTextFromPromptResponse(
  response: { data?: unknown; error?: unknown },
  errorMessage: string,
) {
  const data = response.data;
  if (!data || typeof data !== "object" || !("parts" in data)) {
    const maybeError = "error" in response ? response.error : undefined;
    throw maybeError instanceof Error ? maybeError : new Error(errorMessage);
  }

  const potentialParts = (data as { parts?: unknown }).parts;
  const parts: unknown[] = Array.isArray(potentialParts) ? potentialParts : [];
  const text = parts
    .filter(isTextPart)
    .map((part) => part.text.trim())
    .filter((segment) => segment.length > 0)
    .join("\n\n");

  if (!text) {
    throw new Error(errorMessage);
  }

  return text;
}

function isTextPart(part: unknown): part is { type: "text"; text: string } {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { type?: unknown; text?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}

async function generateCommitMessage(options: {
  sessionId: string;
  plan: string;
  statusSummary: string;
  diffStat: string;
  branchName: string;
  ticketTitle: string;
  projectTitle: string;
  ticketId: string;
  directory: string;
  opencode: OpencodeClient;
}) {
  const planExcerpt =
    options.plan.length > 2_000
      ? `${options.plan.slice(0, 2_000)}\n\n... (truncated)`
      : options.plan;

  const promptText = [
    "Create a concise git commit message summarizing the implemented changes.",
    "Constraints:",
    "- Single line, maximum 72 characters.",
    '- Imperative mood (e.g., "Add", "Fix").',
    "- Follow Conventional Commits (feat|fix|chore|docs|refactor|test|build|ci|perf|style) with optional scope.",
    "- No surrounding quotes or trailing punctuation.",
    "- Mention the ticket context when useful.",
    "",
    `Ticket: ${options.ticketId} — ${options.ticketTitle}`,
    `Project: ${options.projectTitle}`,
    `Branch: ${options.branchName}`,
    "",
    "Implementation plan excerpt:",
    wrapAsCodeFence(planExcerpt, "markdown"),
    "",
    "Git status summary:",
    wrapAsCodeFence(options.statusSummary || "(clean)", ""),
    "",
    "Diff stats:",
    wrapAsCodeFence(options.diffStat || "(empty)", ""),
  ].join("\n");

  const response = await options.opencode.session.prompt({
    path: {
      id: options.sessionId,
    },
    query: {
      directory: options.directory,
    },
    body: {
      parts: [
        {
          type: "text",
          text: promptText,
        },
      ],
    },
    throwOnError: true,
  });

  const rawMessage = extractTextFromPromptResponse(
    response,
    "Commit message generation failed.",
  );

  const firstLine = rawMessage.split(/\r?\n/)[0]?.trim() ?? "";
  const normalized = firstLine.replace(/^["'`]+|["'`]+$/g, "");
  const sliced =
    normalized.length > 72
      ? normalized.slice(0, 72).replace(/\s+\S*$/, "")
      : normalized;
  const conventionalPattern =
    /^(feat|fix|chore|docs|refactor|test|build|ci|perf|style)(\([^)]+\))?:\s.+/;
  if (sliced.length === 0 || !conventionalPattern.test(sliced)) {
    const summary = options.ticketTitle || `ticket ${options.ticketId}`;
    const base = `feat: ${summary}`;
    const trimmed = base.length > 72 ? `${base.slice(0, 69)}...` : base;
    return trimmed;
  }
  return sliced;
}

async function generatePullRequestDescription(options: {
  sessionId: string;
  plan: string;
  statusSummary: string;
  diffStat: string;
  commitMessage: string;
  ticketTitle: string;
  projectTitle: string;
  baseBranch: string;
  directory: string;
  opencode: OpencodeClient;
}) {
  const promptText = [
    "Draft a pull request description in Markdown summarizing the implementation progress.",
    "Structure the output with headings: Summary, Changes, Testing, Risks.",
    "Use concise bullet points, highlight key commits, and tie back to the approved plan.",
    "If testing was not run, explicitly state what still needs coverage.",
    "Close with an Action Items checklist if follow-ups remain.",
    "",
    `Commit: ${options.commitMessage}`,
    `Ticket: ${options.ticketTitle}`,
    `Project: ${options.projectTitle}`,
    `Base Branch: ${options.baseBranch}`,
    "",
    "Plan excerpt:",
    wrapAsCodeFence(
      options.plan.length > 2_000
        ? `${options.plan.slice(0, 2_000)}\n\n... (truncated)`
        : options.plan,
      "markdown",
    ),
    "",
    "Git status summary:",
    wrapAsCodeFence(options.statusSummary || "(clean)", ""),
    "",
    "Diff stats:",
    wrapAsCodeFence(options.diffStat || "(empty)", ""),
  ].join("\n");

  const response = await options.opencode.session.prompt({
    path: {
      id: options.sessionId,
    },
    query: {
      directory: options.directory,
    },
    body: {
      parts: [
        {
          type: "text",
          text: promptText,
        },
      ],
    },
    throwOnError: true,
  });

  return extractTextFromPromptResponse(
    response,
    "Pull request description generation failed.",
  );
}

export async function removeOpencodeArtifacts(workspacePath: string) {
  const opencodeDir = `${workspacePath}/.opencode`;

  try {
    const info = await stat(opencodeDir);
    if (info.isDirectory()) {
      await rm(opencodeDir, { recursive: true, force: true });
    }
  } catch {
    // ignore cleanup errors
  }
}

function wrapAsCodeFence(content: string, language: string) {
  const sanitized = content.trim();
  const fenceLanguage = language ? `${language}` : "";
  return ["```" + fenceLanguage, sanitized || "(empty)", "```"].join("\n");
}
