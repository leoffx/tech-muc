import { agentEnvironmentManager } from "~/server/agent/workspace-manager";

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

export async function spawnPlanClient(options: SpawnTicketClientOptions) {
  return agentEnvironmentManager.spawnClient({
    ...options,
    role: "plan",
  });
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
