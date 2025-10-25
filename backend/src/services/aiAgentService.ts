import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { gitService } from './gitService';
import { ticketService } from './ticketService';
import { projectService } from './projectService';
import { commentService } from './commentService';
import { aiJobQueue } from '../jobs/aiQueue';
import { logger } from '../utils/logger';
import { broadcast } from '../ws/broadcaster';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIJobStatus {
  id: string;
  ticketId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiJobs = new Map<string, AIJobStatus>();

class AIAgentService {
  async onTicketMovedToPlan(ticketId: string): Promise<void> {
    const ticket = ticketService.findById(ticketId);
    if (!ticket) {
      logger.error({ ticketId }, 'Ticket not found');
      return;
    }

    const project = projectService.findById(ticket.projectId);
    if (!project) {
      logger.error({ ticketId, projectId: ticket.projectId }, 'Project not found');
      return;
    }

    const existingJob = Array.from(aiJobs.values()).find(
      job => job.ticketId === ticketId && job.status !== 'error'
    );
    
    if (existingJob) {
      logger.info({ ticketId, jobId: existingJob.id }, 'AI job already exists for ticket');
      return;
    }

    const jobId = uuidv4();
    const job: AIJobStatus = {
      id: jobId,
      ticketId,
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    aiJobs.set(jobId, job);
    broadcast({ 
      type: 'ai_job.created', 
      projectId: ticket.projectId, 
      ticketId, 
      job 
    });

    aiJobQueue.enqueue({
      id: jobId,
      ticketId,
      projectId: ticket.projectId,
      execute: async () => {
        await this.processTicket(jobId, ticketId, project.repoUrl);
      },
    });

    logger.info({ jobId, ticketId }, 'AI analysis job created');
  }

  private async processTicket(jobId: string, ticketId: string, repoUrl: string): Promise<void> {
    const job = aiJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.updatedAt = new Date();
      
      const currentTicket = ticketService.findById(ticketId);
      if (currentTicket) {
        broadcast({ 
          type: 'ai_job.updated', 
          projectId: currentTicket.projectId, 
          ticketId, 
          job 
        });
      }

      const ticket = ticketService.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      logger.info({ jobId, ticketId, repoUrl }, 'Starting AI analysis');

      const repoPath = await gitService.cloneOrPullRepo(repoUrl);
      const repoStructure = await gitService.getRepoStructure(repoPath);

      const prompt = this.buildPrompt(ticket.title, ticket.description, repoStructure);
      const analysis = await this.callOpenAI(prompt);

      commentService.create(ticketId, analysis, 'AI Agent', 'ai');

      job.status = 'done';
      job.updatedAt = new Date();
      
      broadcast({ 
        type: 'ai_job.updated', 
        projectId: ticket.projectId, 
        ticketId, 
        job 
      });
      broadcast({
        type: 'comment.created',
        projectId: ticket.projectId,
        ticketId,
        comment: commentService.findByTicket(ticketId).slice(-1)[0],
      });

      logger.info({ jobId, ticketId }, 'AI analysis completed');
    } catch (error) {
      logger.error({ jobId, ticketId, error }, 'AI analysis failed');
      
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date();
      
      const currentTicket = ticketService.findById(ticketId);
      if (currentTicket) {
        broadcast({ 
          type: 'ai_job.updated', 
          projectId: currentTicket.projectId, 
          ticketId, 
          job 
        });
      }
    }
  }

  private buildPrompt(title: string, description: string | undefined, repoStructure: string): string {
    return `You are an expert software engineer analyzing a codebase to create an implementation plan.

**Repository Structure:**
\`\`\`
${repoStructure.slice(0, 5000)}
\`\`\`

**Task:**
Title: ${title}
Description: ${description || 'No description provided'}

**Instructions:**
1. Analyze the repository structure above
2. Identify the relevant files and components needed for this task
3. Create a detailed implementation plan with specific steps
4. Suggest which files need to be created or modified
5. Highlight potential challenges or dependencies

Provide a clear, actionable plan in markdown format.`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software engineer helping to create implementation plans for development tasks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'No response from AI';
  }

  getJobStatus(jobId: string): AIJobStatus | undefined {
    return aiJobs.get(jobId);
  }

  getJobsByTicket(ticketId: string): AIJobStatus[] {
    return Array.from(aiJobs.values()).filter(job => job.ticketId === ticketId);
  }

  getAllJobs(): AIJobStatus[] {
    return Array.from(aiJobs.values());
  }
}

export const aiAgentService = new AIAgentService();
