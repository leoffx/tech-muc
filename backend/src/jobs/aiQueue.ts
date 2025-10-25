import { logger } from '../utils/logger.js';

export interface AIJob {
  id: string;
  ticketId: string;
  projectId: string;
  execute: () => Promise<void>;
}

class AIJobQueue {
  private queue: AIJob[] = [];
  private running = 0;
  private readonly maxConcurrent = 2;

  enqueue(job: AIJob): void {
    this.queue.push(job);
    logger.info({ jobId: job.id, ticketId: job.ticketId }, 'Job enqueued');
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.running++;
    logger.info({ jobId: job.id, ticketId: job.ticketId, running: this.running }, 'Job started');

    try {
      await job.execute();
      logger.info({ jobId: job.id, ticketId: job.ticketId }, 'Job completed');
    } catch (error) {
      logger.error({ jobId: job.id, ticketId: job.ticketId, error }, 'Job failed');
    } finally {
      this.running--;
      this.processNext();
    }
  }

  getStatus(): { queued: number; running: number } {
    return {
      queued: this.queue.length,
      running: this.running,
    };
  }
}

export const aiJobQueue = new AIJobQueue();
