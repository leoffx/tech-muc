import { agentEnvironmentManager } from "~/server/agent/workspace-manager";
import { getOpencodeClient } from "~/server/agent/opencode";
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
}

export interface SpawnPlanResult {
  client: AgentClientDescriptor;
  markdown: string;
}

export async function ensureTicketWorkspace(options: EnsureTicketWorkspaceOptions) {
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

export async function spawnPlanClient(options: SpawnPlanClientOptions): Promise<SpawnPlanResult> {
  const { prompt, ...spawnOptions } = options;

  const client = await agentEnvironmentManager.spawnClient({
    ...spawnOptions,
    role: "plan",
  });

  const opencode = await getOpencodeClient();

  const response = await opencode.session.prompt({
    path: {
      id: client.sessionId,
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

  const data = response.data;
  if (!data || typeof data !== "object" || !("parts" in data)) {
    const maybeError = "error" in response ? response.error : undefined;
    throw maybeError instanceof Error
      ? maybeError
      : new Error("Plan generation did not return any content");
  }

  const parts: unknown[] = Array.isArray(data.parts) ? data.parts : [];
  const markdown = parts
    .filter(isTextPart)
    .map((part) => part.text.trim())
    .filter((text) => text.length > 0)
    .join("\n\n");

  if (!markdown) {
    throw new Error("Plan generation completed without producing textual output");
  }

  return {
    client,
    markdown,
  };
}

export async function spawnImplementationClient(
  options: SpawnTicketClientOptions,
) {
  return agentEnvironmentManager.spawnClient({
    ...options,
    role: "implementation",
  });
}

export async function spawnGeneralClient(options: SpawnTicketClientOptions) {
  return agentEnvironmentManager.spawnClient({
    ...options,
    role: "general",
  });
}

function isTextPart(part: unknown): part is { type: "text"; text: string } {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { type?: unknown; text?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}
