import { Router, Request, Response } from 'express';
import { projectService } from '../services/projectService';
import { ticketService } from '../services/ticketService';

export const boardRouter = Router();

boardRouter.get('/projects/:id/board', (req: Request, res: Response) => {
  const project = projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const tickets = ticketService.findByProject(project.id);
  const board = {
    todo: tickets.filter(t => t.status === 'todo'),
    'in-progress': tickets.filter(t => t.status === 'in-progress'),
    done: tickets.filter(t => t.status === 'done'),
  };

  res.json(board);
});
