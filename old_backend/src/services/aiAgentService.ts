import { v4 as uuidv4 } from 'uuid';
import { gitService } from './gitService.js';
import { ticketService } from './ticketService.js';
import { projectService } from './projectService.js';
import { commentService } from './commentService.js';
import {
  initializeOpencode,
  createSession,
  promptAgent,
} from './opencodeService.js';
import { aiJobQueue } from '../jobs/aiQueue.js';
import { logger } from '../utils/logger.js';
import { broadcast } from '../ws/broadcaster.js';
import { runCommand } from '../utils/exec.js';

type AIJobType = 'analysis' | 'implementation';

export interface AIJobStatus {
  id: string;
  ticketId: string;
  type: AIJobType;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImplementationArtifacts {
  patch: string;
  commitMessage?: string;
  prTitle?: string;
  prBody?: string;
}

const aiJobs = new Map<string, AIJobStatus>();

class AIAgentService {
  async onTicketMovedToPlan(ticketId: string): Promise<void> {
    const ticket = await ticketService.findById(ticketId);
    if (!ticket) {
      logger.error({ ticketId }, 'Ticket not found');
      return;
    }

    const project = await projectService.findById(ticket.projectId);
    if (!project) {
      logger.error(
        { ticketId, projectId: ticket.projectId },
        'Project not found'
      );
      return;
    }

    const existingJob = this.findJob(ticketId, 'analysis');
    if (existingJob && existingJob.status !== 'error') {
      logger.info(
        { ticketId, jobId: existingJob.id },
        'Analysis job already exists for ticket'
      );
      return;
    }

    const jobId = uuidv4();
    const job: AIJobStatus = {
      id: jobId,
      ticketId,
      type: 'analysis',
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    aiJobs.set(jobId, job);
    broadcast({
      type: 'ai_job.created',
      projectId: ticket.projectId,
      ticketId,
      job,
    });

    aiJobQueue.enqueue({
      id: jobId,
      ticketId,
      projectId: ticket.projectId,
      execute: async () => {
        await this.processAnalysisJob(jobId, ticketId, project.repoUrl);
      },
    });

    logger.info({ jobId, ticketId }, 'AI analysis job created');
  }

  async onTicketMovedToInProgress(ticketId: string): Promise<void> {
    const ticket = await ticketService.findById(ticketId);
    if (!ticket) {
      logger.error({ ticketId }, 'Ticket not found');
      return;
    }

    const project = await projectService.findById(ticket.projectId);
    if (!project) {
      logger.error(
        { ticketId, projectId: ticket.projectId },
        'Project not found'
      );
      return;
    }

    const existingJob = this.findJob(ticketId, 'implementation');
    if (existingJob && existingJob.status !== 'error') {
      logger.info(
        { ticketId, jobId: existingJob.id },
        'Implementation job already exists for ticket'
      );
      return;
    }

    const jobId = uuidv4();
    const job: AIJobStatus = {
      id: jobId,
      ticketId,
      type: 'implementation',
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    aiJobs.set(jobId, job);
    broadcast({
      type: 'ai_job.created',
      projectId: ticket.projectId,
      ticketId,
      job,
    });

    aiJobQueue.enqueue({
      id: jobId,
      ticketId,
      projectId: ticket.projectId,
      execute: async () => {
        await this.processImplementationJob(jobId, ticketId, project.repoUrl);
      },
    });

    logger.info({ jobId, ticketId }, 'AI implementation job created');
  }

  private findJob(ticketId: string, type: AIJobType): AIJobStatus | undefined {
    return Array.from(aiJobs.values()).find(
      (job) => job.ticketId === ticketId && job.type === type
    );
  }

  private async processAnalysisJob(
    jobId: string,
    ticketId: string,
    repoUrl: string
  ): Promise<void> {
    const job = aiJobs.get(jobId);
    if (!job) return;

    try {
      job.status = "running";
      job.updatedAt = new Date();

      const currentTicket = await ticketService.findById(ticketId);
      if (currentTicket) {
        broadcast({
          type: "ai_job.updated",
          projectId: currentTicket.projectId,
          ticketId,
          job,
        });
      }

      const ticket = await ticketService.findById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      logger.info(
        { jobId, ticketId, repoUrl },
        "Starting AI analysis with OpenCode agent"
      );

      await initializeOpencode();
      const sessionId = await createSession(
        `Ticket #${ticketId}: ${ticket.title}`
      );

      const repoPath = await gitService.cloneOrPullRepo(repoUrl);
      const repoStructure = await gitService.getRepoStructure(repoPath);

      const prompt = this.buildPromptForOpenCode(
        ticket.title,
        ticket.description,
        repoStructure,
        repoPath
      );
      const analysis = await promptAgent(prompt, sessionId);

      await commentService.create(ticketId, analysis, null as any, "ai");

      job.status = "done";
      job.updatedAt = new Date();

      broadcast({
        type: "ai_job.updated",
        projectId: ticket.projectId,
        ticketId,
        job,
      });
      const comments = await commentService.findByTicket(ticketId);
      broadcast({
        type: "comment.created",
        projectId: ticket.projectId,
        ticketId,
        comment: comments.slice(-1)[0],
      });

      logger.info(
        { jobId, ticketId, sessionId },
        "AI analysis completed with OpenCode"
      );
    } catch (error) {
      logger.error({ jobId, ticketId, error }, "AI analysis failed");

      job.status = "error";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.updatedAt = new Date();

      const currentTicket = await ticketService.findById(ticketId);
      if (currentTicket) {
        broadcast({
          type: "ai_job.updated",
          projectId: currentTicket.projectId,
          ticketId,
          job,
        });
      }
    }
  }

  private buildPromptForOpenCode(
    title: string,
    description: string | undefined,
    repoStructure: string,
    repoPath: string
  ): string {
    return `You are an expert software engineer analyzing a codebase to create an implementation plan.

**Repository Location:** ${repoPath}

**Repository Structure:**
\`\`\`
${repoStructure.slice(0, 5000)}
\`\`\`

**Task:**
Title: ${title}
Description: ${description || "No description provided"}

**Instructions:**
1. Analyze the repository structure above and examine relevant files in the repository at ${repoPath}
2. Identify the specific files and components that need to be modified or created for this task
3. Create a detailed, step-by-step implementation plan
4. For each step, specify:
   - Which files need to be created or modified
   - What changes are required
   - Any dependencies or prerequisites
5. Highlight potential challenges, edge cases, and testing considerations
6. Follow the existing code patterns and conventions in the repository
7. Keep the final plan concise—no more than 1000 characters total

Provide a clear, actionable plan in markdown format that a developer can follow to implement this feature.`;
  }

  private async processImplementationJob(
    jobId: string,
    ticketId: string,
    repoUrl: string
  ): Promise<void> {
    const job = aiJobs.get(jobId);
    if (!job) return;

    let repoPath: string | undefined;
    let defaultBranch: string | undefined;
    let branchName: string | undefined;

    try {
      job.status = 'running';
      job.updatedAt = new Date();

      const currentTicket = await ticketService.findById(ticketId);
      if (currentTicket) {
        broadcast({
          type: 'ai_job.updated',
          projectId: currentTicket.projectId,
          ticketId,
          job,
        });
      }

      const ticket = await ticketService.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const project = await projectService.findById(ticket.projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const comments = await commentService.findByTicket(ticketId);
      repoPath = await gitService.cloneOrPullRepo(repoUrl);
      const repoStructure = await gitService.getRepoStructure(repoPath);
      defaultBranch = await this.getDefaultBranch(repoPath);
      branchName = this.buildBranchName(ticket.title, ticket.id);

      await this.prepareRepository(repoPath, defaultBranch, branchName);

      await initializeOpencode();
      const sessionId = await createSession(
        `Implementation for Ticket #${ticketId}: ${ticket.title}`
      );

      const prompt = this.buildImplementationPrompt(
        ticket.title,
        ticket.description,
        comments.map((comment) => ({
          id: comment.id,
          kind: comment.kind,
          body: comment.body,
          createdAt: comment.createdAt,
          authorId: comment.authorId,
        })),
        repoStructure,
        repoPath
      );

      const response = await promptAgent(prompt, sessionId);
      const artifacts = this.parseImplementationResponse(response);

      if (!artifacts.patch || !artifacts.patch.trim()) {
        throw new Error('Implementation agent returned an empty patch');
      }

      await runCommand('git', ['apply', '--whitespace=nowarn'], {
        cwd: repoPath,
        input: artifacts.patch,
      });

      const status = await runCommand('git', ['status', '--porcelain'], {
        cwd: repoPath,
      });
      if (!status.stdout.trim()) {
        throw new Error('Patch applied but produced no changes');
      }

      await runCommand('git', ['add', '--all'], { cwd: repoPath });

      const commitMessage =
        artifacts.commitMessage?.trim() || `Implement ${ticket.title}`;
      await runCommand('git', ['commit', '-m', commitMessage], {
        cwd: repoPath,
      });

      await runCommand('git', ['push', '--set-upstream', 'origin', branchName], {
        cwd: repoPath,
      });

      const prTitle =
        artifacts.prTitle?.trim() || `Implement ${ticket.title}`;
      const prBody =
        artifacts.prBody?.trim() ||
        `Automated implementation for ticket ${ticket.title} (${ticket.id}).`;

      const prResult = await runCommand(
        'gh',
        [
          'pr',
          'create',
          '--head',
          branchName,
          '--base',
          defaultBranch,
          '--title',
          prTitle,
          '--body',
          prBody,
        ],
        { cwd: repoPath }
      );

      const prUrl = this.extractPrUrl(prResult.stdout);
      if (!prUrl) {
        throw new Error('Failed to extract PR URL from GitHub CLI output');
      }

      const commentBody = `🚀 Created PR for this ticket: ${prUrl}`;
      const comment = await commentService.create(
        ticketId,
        commentBody,
        null as any,
        'ai'
      );

      job.status = 'done';
      job.updatedAt = new Date();

      broadcast({
        type: 'ai_job.updated',
        projectId: ticket.projectId,
        ticketId,
        job,
      });

      broadcast({
        type: 'comment.created',
        projectId: ticket.projectId,
        ticketId,
        comment,
      });

      logger.info(
        { jobId, ticketId, branchName, prUrl },
        'AI implementation completed'
      );
    } catch (error) {
      logger.error({ jobId, ticketId, error }, 'AI implementation failed');

      const job = aiJobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.updatedAt = new Date();
      }

      const ticket = await ticketService.findById(ticketId);
      if (ticket) {
        broadcast({
          type: 'ai_job.updated',
          projectId: ticket.projectId,
          ticketId,
          job: job as AIJobStatus,
        });
      }
    } finally {
      try {
        if (repoPath && defaultBranch) {
          await runCommand('git', ['checkout', defaultBranch], {
            cwd: repoPath,
          });
          await runCommand(
            'git',
            ['reset', '--hard', `origin/${defaultBranch}`],
            {
              cwd: repoPath,
            }
          );
          await runCommand('git', ['clean', '-fd'], { cwd: repoPath });
        }
      } catch (cleanupError) {
        logger.warn({ ticketId, cleanupError }, 'Failed to clean repository');
      }
    }
  }

  private buildImplementationPrompt(
    title: string,
    description: string | undefined,
    comments: {
      id: string;
      kind: 'user' | 'ai';
      body: string;
      createdAt: Date;
      authorId: string | null;
    }[],
    repoStructure: string,
    repoPath: string
  ): string {
    const sortedComments = comments
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-10);

    const formattedComments =
      sortedComments.length === 0
        ? 'No prior comments.'
        : sortedComments
            .map(
              (comment, index) =>
                `${index + 1}. [${comment.kind}] ${comment.body.trim()}`
            )
            .join('\n');

    return `You are an autonomous coding agent working in ${repoPath}.

Ticket Title: ${title}
Ticket Description: ${description || 'No description provided.'}

Recent Comments:
${formattedComments}

Repository Structure (truncated):
\`\`\`
${repoStructure.slice(0, 4000)}
\`\`\`

Goal:
Implement the ticket requirements using the repository at ${repoPath}. Produce working code that satisfies the ticket and aligns with any plans mentioned in the comments above.

Response Requirements:
- Respond with JSON ONLY.
- JSON must include keys: patch, commitMessage, prTitle, prBody.
- patch must be a valid unified diff that applies cleanly to the current repository state.
- Do not wrap the JSON in backticks or include additional commentary.
- Keep patch size focused on the necessary changes.

Example response:
{"patch":"diff --git ...","commitMessage":"<message>","prTitle":"<title>","prBody":"<body>"}`;
  }

  private parseImplementationResponse(response: string): ImplementationArtifacts {
    const extractJson = (input: string): string => {
      if (!input) {
        throw new Error('Implementation response is empty');
      }

      const trimmed = input.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return trimmed;
      }

      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('Implementation response did not include JSON payload');
      }

      return trimmed.slice(firstBrace, lastBrace + 1);
    };

    const jsonPayload = extractJson(response);
    try {
      const parsed = JSON.parse(jsonPayload);
      return parsed as ImplementationArtifacts;
    } catch (error) {
      throw new Error('Failed to parse implementation JSON response');
    }
  }

  private buildBranchName(title: string, ticketId: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const shortId = ticketId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    return `ticket/${shortId || 'update'}-${slug || 'update'}`;
  }

  private async getDefaultBranch(repoPath: string): Promise<string> {
    try {
      const { stdout } = await runCommand(
        'git',
        ['remote', 'show', 'origin'],
        { cwd: repoPath }
      );
      const headLine = stdout
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('HEAD branch:'));

      if (headLine) {
        return headLine.split(':')[1].trim();
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to detect remote default branch');
    }
    return 'main';
  }

  private async prepareRepository(
    repoPath: string,
    defaultBranch: string,
    branchName: string
  ): Promise<void> {
    await runCommand('git', ['fetch', 'origin'], { cwd: repoPath });
    await runCommand('git', ['checkout', defaultBranch], { cwd: repoPath });
    await runCommand('git', ['reset', '--hard', `origin/${defaultBranch}`], {
      cwd: repoPath,
    });
    await runCommand('git', ['clean', '-fd'], { cwd: repoPath });

    try {
      await runCommand('git', ['branch', '-D', branchName], { cwd: repoPath });
    } catch {
      // ignore if branch does not exist
    }

    await runCommand('git', ['checkout', '-b', branchName], { cwd: repoPath });
  }

  private extractPrUrl(output: string): string | null {
    const lines = output.split('\n').map((line) => line.trim());
    for (const line of lines.reverse()) {
      if (line.startsWith('https://')) {
        return line;
      }
    }
    return null;
  }

  getJobStatus(jobId: string): AIJobStatus | undefined {
    return aiJobs.get(jobId);
  }

  getJobsByTicket(ticketId: string): AIJobStatus[] {
    return Array.from(aiJobs.values()).filter(
      (job) => job.ticketId === ticketId
    );
  }

  getAllJobs(): AIJobStatus[] {
    return Array.from(aiJobs.values());
  }
}

export const aiAgentService = new AIAgentService();
