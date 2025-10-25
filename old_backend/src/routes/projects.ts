import { Router, Request, Response } from 'express';
import { projectService } from '../services/projectService.js';
import { ticketService } from '../services/ticketService.js';
import { createProjectSchema } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

export const projectsRouter = Router();

projectsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await projectService.create(data.name, data.repoUrl);
    logger.info({ projectId: project.id }, 'Project created');
    res.status(201).json(project);
  } catch (err) {
    logger.error({ err }, 'Failed to create project');
    res.status(400).json({ error: 'Invalid request' });
  }
});

projectsRouter.get('/:id', async (req: Request, res: Response) => {
  const project = await projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

projectsRouter.get('/', async (req: Request, res: Response) => {
  const projects = await projectService.findAll();
  res.json(projects);
});

projectsRouter.get('/:id/tickets', async (req: Request, res: Response) => {
  const project = await projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const tickets = ticketService.findByProject(req.params.id);
  res.json(tickets);
});
