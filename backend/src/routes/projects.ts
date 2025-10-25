import { Router, Request, Response } from 'express';
import { projectService } from '../services/projectService';
import { createProjectSchema } from '../utils/validators';
import { logger } from '../utils/logger';

export const projectsRouter = Router();

projectsRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = projectService.create(data.name, data.repoUrl);
    logger.info({ projectId: project.id }, 'Project created');
    res.status(201).json(project);
  } catch (err) {
    logger.error({ err }, 'Failed to create project');
    res.status(400).json({ error: 'Invalid request' });
  }
});

projectsRouter.get('/:id', (req: Request, res: Response) => {
  const project = projectService.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

projectsRouter.get('/', (req: Request, res: Response) => {
  const projects = projectService.findAll();
  res.json(projects);
});
