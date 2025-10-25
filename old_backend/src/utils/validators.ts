import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1),
  repoUrl: z.string().url(),
});

export const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'plan', 'in_progress', 'done']).default('todo'),
  assigneeId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'plan', 'in_progress', 'done']).optional(),
  assigneeId: z.string().optional(),
});

export const moveTicketSchema = z.object({
  status: z.enum(['todo', 'plan', 'in_progress', 'done']),
});

export const createCommentSchema = z.object({
  content: z.string().min(1),
  author: z.string().min(1),
});
