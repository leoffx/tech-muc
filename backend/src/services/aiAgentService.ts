import { v4 as uuidv4 } from "uuid";
import { gitService } from "./gitService";
import { ticketService } from "./ticketService";
import { projectService } from "./projectService";
import { commentService } from "./commentService";
import {
  initializeOpencode,
  createSession,
  promptAgent,
} from "./opencodeService";
import { aiJobQueue } from "../jobs/aiQueue";
import { logger } from "../utils/logger";
import { broadcast } from "../ws/broadcaster";

export interface AIJobStatus {
  id: string;
  ticketId: string;
  status: "queued" | "running" | "done" | "error";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiJobs = new Map<string, AIJobStatus>();

class AIAgentService {
  async onTicketMovedToPlan(ticketId: string): Promise<void> {
    const ticket = await ticketService.findById(ticketId);
    if (!ticket) {
      logger.error({ ticketId }, "Ticket not found");
      return;
    }

    const project = await projectService.findById(ticket.projectId);
    if (!project) {
      logger.error(
        { ticketId, projectId: ticket.projectId },
        "Project not found"
      );
      return;
    }

    const existingJob = Array.from(aiJobs.values()).find(
      (job) => job.ticketId === ticketId && job.status !== "error"
    );

    if (existingJob) {
      logger.info(
        { ticketId, jobId: existingJob.id },
        "AI job already exists for ticket"
      );
      return;
    }

    const jobId = uuidv4();
    const job: AIJobStatus = {
      id: jobId,
      ticketId,
      status: "queued",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    aiJobs.set(jobId, job);
    broadcast({
      type: "ai_job.created",
      projectId: ticket.projectId,
      ticketId,
      job,
    });

    aiJobQueue.enqueue({
      id: jobId,
      ticketId,
      projectId: ticket.projectId,
      execute: async () => {
        await this.processTicket(jobId, ticketId, project.repoUrl);
      },
    });

    logger.info({ jobId, ticketId }, "AI analysis job created");
  }

  private async processTicket(
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

      await commentService.create(ticketId, analysis, "AI Agent", "ai");

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

Provide a clear, actionable plan in markdown format that a developer can follow to implement this feature.`;
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
