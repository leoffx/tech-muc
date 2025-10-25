import { Router, Request, Response } from 'express';
import { ticketService } from '../services/ticketService.js';
import { commentService } from '../services/commentService.js';
import { projectService } from '../services/projectService.js';
import { aiAgentService } from '../services/aiAgentService.js';
import { createTicketSchema, updateTicketSchema, moveTicketSchema, createCommentSchema } from '../utils/validators.js';
import { logger } from '../utils/logger.js';
import { broadcast } from '../ws/broadcaster.js';

export const ticketsRouter = Router();

ticketsRouter.get('/', async (req: Request, res: Response) => {
  const { projectId } = req.query;
  
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Project ID required' });
  }

  const project = await projectService.findById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const tickets = await ticketService.findByProject(projectId);
  const commentsByTicket = await commentService.findByTickets(
    tickets.map((ticket) => ticket.id)
  );
  res.json(
    tickets.map((ticket) => ({
      ...ticket,
      comments: commentsByTicket[ticket.id] || [],
    }))
  );
});

ticketsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, ...data } = req.body;
    
    const project = await projectService.findById(projectId);
    if (!projectId || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const validData = createTicketSchema.parse(data);
    const ticket = await ticketService.create(projectId, validData);
    
    broadcast({ type: 'ticket.created', projectId, ticket });
    logger.info({ ticketId: ticket.id, projectId }, 'Ticket created');
    
    res.status(201).json(ticket);
  } catch (err) {
    logger.error({ err }, 'Failed to create ticket');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.get('/:id', async (req: Request, res: Response) => {
  const ticket = await ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

ticketsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validData = updateTicketSchema.parse(req.body);
    const ticket = await ticketService.update(req.params.id, validData);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    broadcast({ type: 'ticket.updated', projectId: ticket.projectId, ticket });
    logger.info({ ticketId: ticket.id }, 'Ticket updated');
    
    res.json(ticket);
  } catch (err) {
    logger.error({ err }, 'Failed to update ticket');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.patch('/:id/move', async (req: Request, res: Response) => {
  try {
    const { status } = moveTicketSchema.parse(req.body);
    const ticket = await ticketService.update(req.params.id, { status });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    broadcast({ type: 'ticket.updated', projectId: ticket.projectId, ticket });
    logger.info({ ticketId: ticket.id, status }, 'Ticket moved');
    
    if (status === 'plan') {
      await aiAgentService.onTicketMovedToPlan(ticket.id);
    }

    if (status === 'in_progress') {
      await aiAgentService.onTicketMovedToInProgress(ticket.id);
    }
    
    res.json(ticket);
  } catch (err) {
    logger.error({ err }, 'Failed to move ticket');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.delete('/:id', async (req: Request, res: Response) => {
  const ticket = await ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const deleted = await ticketService.delete(req.params.id);
  if (deleted) {
    broadcast({ type: 'ticket.deleted', projectId: ticket.projectId, ticketId: ticket.id });
    logger.info({ ticketId: ticket.id }, 'Ticket deleted');
  }

  res.status(204).send();
});

ticketsRouter.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { content, author } = createCommentSchema.parse(req.body);
    const comment = await commentService.create(ticket.id, content, author);
    
    broadcast({ type: 'comment.created', projectId: ticket.projectId, ticketId: ticket.id, comment });
    logger.info({ commentId: comment.id, ticketId: ticket.id }, 'Comment created');
    
    res.status(201).json(comment);
  } catch (err) {
    logger.error({ err }, 'Failed to create comment');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.get('/:id/comments', async (req: Request, res: Response) => {
  const ticket = await ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const comments = await commentService.findByTicket(ticket.id);
  res.json(comments);
});
