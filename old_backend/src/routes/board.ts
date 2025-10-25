import { Router, Request, Response } from 'express';
import { projectService } from '../services/projectService.js';
import { ticketService } from '../services/ticketService.js';

export const boardRouter = Router();

boardRouter.get('/projects/:id/board', async (req: Request, res: Response) => {
  const project = await projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const tickets = await ticketService.findByProject(project.id);
  const board = {
    todo: tickets.filter(t => t.status === 'todo'),
    plan: tickets.filter(t => t.status === 'plan'),
    in_progress: tickets.filter(t => t.status === 'in_progress'),
    done: tickets.filter(t => t.status === 'done'),
  };

  res.json(board);
});
