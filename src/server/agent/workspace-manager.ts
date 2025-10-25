import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getOpencodeClient } from "~/server/agent/opencode";

const execFileAsync = promisify(execFile);
const gitEnvironment = Object.freeze({
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_ASKPASS: "echo",
} satisfies NodeJS.ProcessEnv);

async function runGit(args: string[], options?: { cwd?: string }) {
  return execFileAsync("git", args, {
    cwd: options?.cwd,
    env: gitEnvironment,
    windowsHide: true,
  });
}

export type AgentClientRole = "plan" | "implementation" | "general";

export interface AgentClientDescriptor {
  id: string;
  ticketId: string;
  repoUrl: string;
  role: AgentClientRole;
  sessionId: string;
  sessionTitle: string;
  workspacePath: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AgentWorkspaceDescriptor {
  ticketId: string;
  repoUrl: string;
  branch?: string;
  workspacePath: string;
  createdAt: string;
  clients: AgentClientDescriptor[];
}

interface CreateWorkspaceInput {
  ticketId: string;
  repoUrl: string;
  branch?: string;
}

interface SpawnClientInput {
  ticketId: string;
  repoUrl?: string;
  branch?: string;
  role: AgentClientRole;
  metadata?: Record<string, unknown>;
}

export class AgentEnvironmentManager {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly pending = new Map<string, Promise<Workspace>>();
  private readonly baseDir = path.join(os.tmpdir(), "tech-muc-agent");

  async ensureWorkspace(input: CreateWorkspaceInput) {
    const key = this.toKey(input.ticketId);

    const existing = this.workspaces.get(key);
    if (
      existing &&
      (existing.repoUrl !== input.repoUrl || existing.branch !== input.branch)
    ) {
      // Different repo requested for the same ticket - drop former workspace.
      console.info("[AgentWorkspace] Replacing workspace", {
        ticketId: input.ticketId,
        previousRepo: existing.repoUrl,
        previousBranch: existing.branch ?? null,
        nextRepo: input.repoUrl,
        nextBranch: input.branch ?? null,
      });
      this.workspaces.delete(key);
    } else if (existing) {
      await existing.ensure();
      return existing;
    }

    const inFlight = this.pending.get(key);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.prepareWorkspace(input).finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    const workspace = await promise;
    this.workspaces.set(key, workspace);
    return workspace;
  }

  async spawnClient(input: SpawnClientInput) {
    const workspace = await this.getOrCreateWorkspaceForClient(input);
    return workspace.spawnClient(input.role, input.metadata);
  }

  async getWorkspace(ticketId: string) {
    const key = this.toKey(ticketId);
    const workspace = this.workspaces.get(key);
    if (!workspace) {
      return undefined;
    }
    await workspace.ensure();
    return workspace;
  }

  listClients(ticketId: string) {
    const key = this.toKey(ticketId);
    const workspace = this.workspaces.get(key);
    if (!workspace) {
      return [] as AgentClientDescriptor[];
    }
    return workspace.listClients();
  }

  private async getOrCreateWorkspaceForClient(input: SpawnClientInput) {
    const existing = await this.getWorkspace(input.ticketId);

    if (existing) {
      return existing;
    }

    if (!input.repoUrl) {
      throw new Error(
        "Workspace does not exist yet for ticket; repoUrl is required to create it.",
      );
    }

    return this.ensureWorkspace({
      ticketId: input.ticketId,
      repoUrl: input.repoUrl,
      branch: input.branch,
    });
  }

  private async prepareWorkspace(input: CreateWorkspaceInput) {
    const sanitizedTicketId = this.toKey(input.ticketId);
    const workspacePath = path.join(this.baseDir, sanitizedTicketId);

    await mkdir(this.baseDir, { recursive: true });
    const workspace = new Workspace({
      ticketId: input.ticketId,
      repoUrl: input.repoUrl,
      workspacePath,
      branch: input.branch,
    });
    await workspace.ensure();
    console.info("[AgentWorkspace] Prepared workspace", {
      ticketId: input.ticketId,
      repoUrl: input.repoUrl,
      branch: input.branch ?? null,
      workspacePath,
    });
    return workspace;
  }

  private toKey(ticketId: string) {
    return ticketId.trim().replace(/[^A-Za-z0-9_-]+/g, "-").toLowerCase();
  }
}

export const agentEnvironmentManager = new AgentEnvironmentManager();

class Workspace {
  readonly createdAt = new Date();
  readonly clients = new Map<string, AgentClientDescriptor>();

  constructor(
    readonly options: {
      ticketId: string;
      repoUrl: string;
      workspacePath: string;
      branch?: string;
    },
  ) {}

  get ticketId() {
    return this.options.ticketId;
  }

  get repoUrl() {
    return this.options.repoUrl;
  }

  get branch() {
    return this.options.branch;
  }

  get workspacePath() {
    return this.options.workspacePath;
  }

  async ensure() {
    const hasWorkspace = await this.pathExists(this.workspacePath);
    const gitDir = path.join(this.workspacePath, ".git");

    if (hasWorkspace && (await this.pathExists(gitDir))) {
      console.info("[AgentWorkspace] Fast-forward workspace", {
        ticketId: this.ticketId,
        repoUrl: this.repoUrl,
        branch: this.branch ?? null,
        workspacePath: this.workspacePath,
      });
      await this.fetchAndReset();
      return;
    }

    if (hasWorkspace) {
      console.info("[AgentWorkspace] Removing stale workspace", {
        ticketId: this.ticketId,
        repoUrl: this.repoUrl,
        branch: this.branch ?? null,
        workspacePath: this.workspacePath,
      });
      await rm(this.workspacePath, { recursive: true, force: true });
    }

    console.info("[AgentWorkspace] Cloning repository", {
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      branch: this.branch ?? null,
      workspacePath: this.workspacePath,
    });
    await runGit(this.cloneArgs());
  }

  async spawnClient(role: AgentClientRole, metadata?: Record<string, unknown>) {
    const opencode = await getOpencodeClient();
    const potentialTitle = metadata?.title;
    const title =
      typeof potentialTitle === "string" && potentialTitle.trim().length > 0
        ? potentialTitle
        : `Ticket ${this.ticketId} (${role})`;

    const sessionResponse = await opencode.session.create({
      body: {
        title,
      },
      throwOnError: true,
    });

    const session = sessionResponse.data;
    if (!session || typeof session !== "object" || !("id" in session)) {
      const maybeError =
        "error" in sessionResponse ? sessionResponse.error : undefined;
      throw maybeError instanceof Error
        ? maybeError
        : new Error("OpenCode session creation failed");
    }

    const descriptorMetadata = {
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      branch: this.branch ?? null,
      role,
      workspacePath: this.workspacePath,
      ...(metadata ?? {}),
    } satisfies Record<string, unknown>;

    const descriptor: AgentClientDescriptor = {
      id: String(session.id),
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      role,
      sessionId: String(session.id),
      sessionTitle: title,
      workspacePath: this.workspacePath,
      createdAt: new Date().toISOString(),
      metadata: descriptorMetadata,
    };

    this.clients.set(descriptor.id, descriptor);
    console.info("[AgentWorkspace] Spawned client", {
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      branch: this.branch ?? null,
      role,
      sessionId: descriptor.sessionId,
    });
    return descriptor;
  }

  listClients() {
    return Array.from(this.clients.values()).map((client) => ({
      ...client,
      metadata: client.metadata
        ? { ...client.metadata }
        : undefined,
    }));
  }

  toDescriptor(): AgentWorkspaceDescriptor {
    return {
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      branch: this.branch,
      workspacePath: this.workspacePath,
      createdAt: this.createdAt.toISOString(),
      clients: this.listClients(),
    };
  }

  private cloneArgs() {
    const args = ["clone"];
    if (this.branch) {
      args.push("--branch", this.branch, "--single-branch");
    }
    args.push(this.repoUrl, this.workspacePath);
    return args;
  }

  private async fetchAndReset() {
    const gitDir = this.workspacePath;
    await runGit(["remote", "set-url", "origin", this.repoUrl], {
      cwd: gitDir,
    });
    await runGit(["fetch", "origin", "--prune"], { cwd: gitDir });

    if (this.branch) {
      const remoteTarget = `origin/${this.branch}`;
      await runGit(["checkout", "-B", this.branch], {
        cwd: gitDir,
      });
      if (await this.refExists(remoteTarget, gitDir)) {
        await runGit(["reset", "--hard", remoteTarget], { cwd: gitDir });
      } else {
        console.warn("[AgentWorkspace] Remote target missing, skipping hard reset", {
          ticketId: this.ticketId,
          repoUrl: this.repoUrl,
          branch: this.branch,
          remoteRef: remoteTarget,
          workspacePath: this.workspacePath,
        });
      }

      console.info("[AgentWorkspace] Synced workspace", {
        ticketId: this.ticketId,
        repoUrl: this.repoUrl,
        branch: this.branch,
        remoteRef: remoteTarget,
        workspacePath: this.workspacePath,
      });
      return;
    }

    const trackingRef = await this.getTrackingBranchRef(gitDir);
    const currentBranch = await this.getCurrentBranchName(gitDir);
    const remoteTarget = trackingRef ?? (currentBranch ? `origin/${currentBranch}` : "origin/main");
    if (await this.refExists(remoteTarget, gitDir)) {
      await runGit(["reset", "--hard", remoteTarget], { cwd: gitDir });
    } else {
      console.warn("[AgentWorkspace] Remote target missing, skipping hard reset", {
        ticketId: this.ticketId,
        repoUrl: this.repoUrl,
        branch: currentBranch ?? null,
        remoteRef: remoteTarget,
        workspacePath: this.workspacePath,
      });
    }

    console.info("[AgentWorkspace] Synced workspace", {
      ticketId: this.ticketId,
      repoUrl: this.repoUrl,
      branch: currentBranch ?? null,
      remoteRef: remoteTarget,
      workspacePath: this.workspacePath,
    });
  }

  private async getCurrentBranchName(gitDir: string) {
    try {
      const { stdout } = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: gitDir,
      });
      const branch = stdout.trim();
      if (branch && branch !== "HEAD") {
        return branch;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async getTrackingBranchRef(gitDir: string) {
    try {
      const { stdout } = await runGit(
        ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
        { cwd: gitDir },
      );
      const ref = stdout.trim();
      return ref.length > 0 ? ref : undefined;
    } catch {
      return undefined;
    }
  }

  private async refExists(ref: string, gitDir: string) {
    try {
      await runGit(["rev-parse", "--verify", ref], { cwd: gitDir });
      return true;
    } catch {
      return false;
    }
  }

  private async pathExists(target: string) {
    try {
      await access(target);
      await stat(target);
      return true;
    } catch {
      return false;
    }
  }
}
