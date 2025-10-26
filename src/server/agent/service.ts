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
    user: string;
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
    user?: string;
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

  await removeOpencodeArtifacts(workspace.workspacePath);

  const statusSummary = await workspace.getStatusSummary();

  const baseCandidates = new Set<string>();
  const normalizedBase = options.baseBranch?.trim() ?? "";
  if (normalizedBase.length > 0) {
    if (normalizedBase.startsWith("origin/")) {
      baseCandidates.add(normalizedBase);
      baseCandidates.add(normalizedBase.replace(/^origin\//, ""));
    } else {
      baseCandidates.add(`origin/${normalizedBase}`);
      baseCandidates.add(normalizedBase);
    }
  }

  let diffReference: string | null = null;
  let diffStat = "";
  let commitsAhead: number | null = null;

  for (const candidate of baseCandidates) {
    const ahead = await workspace.countCommitsSince(candidate);
    if (ahead === null) {
      continue;
    }
    diffReference = candidate;
    commitsAhead = ahead;
    const comparativeStat = await workspace.getDiffStatComparedTo(candidate);
    diffStat = comparativeStat ?? "";
    break;
  }

  if (!diffReference) {
    diffStat = await workspace.getDiffStat();
  }

  console.info("[Implementation] Workspace change summary", {
    ticketId: options.ticketId,
    branchName: options.branchName,
    statusSummary,
    diffStat,
    diffReference,
    commitsAhead,
  });

  const hasUncommittedChanges = await workspace.hasUncommittedChanges();
  if (hasUncommittedChanges) {
    throw new Error(
      "Implementation must finish with a clean working tree. Commit and push all changes before finalization.",
    );
  }

  if (diffReference && typeof commitsAhead === "number" && commitsAhead <= 0) {
    throw new Error(
      "Implementation branch has no commits ahead of the base branch. Create readable commits before finalizing.",
    );
  }

  const commitSummary = await workspace.getHeadCommitSummary();
  const pullRequest = await workspace.getPullRequestSnapshot({
    branchName: options.branchName,
    baseBranch: options.baseBranch,
  });

  return {
    statusSummary,
    diffStat,
    commit: commitSummary,
    pullRequest,
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
      parts: [
        {
          type: "text",
          text: prompt.user,
        },
      ],
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
