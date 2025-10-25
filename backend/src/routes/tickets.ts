import { Router, Request, Response } from 'express';
import { ticketService } from '../services/ticketService';
import { commentService } from '../services/commentService';
import { projectService } from '../services/projectService';
import { aiAgentService } from '../services/aiAgentService';
import { createTicketSchema, updateTicketSchema, moveTicketSchema, createCommentSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { broadcast } from '../ws/broadcaster';

export const ticketsRouter = Router();

ticketsRouter.get('/', (req: Request, res: Response) => {
  const { projectId } = req.query;
  
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Project ID required' });
  }

  if (!projectService.findById(projectId)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const tickets = ticketService.findByProject(projectId);
  res.json(tickets);
});

ticketsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { projectId, ...data } = req.body;
    
    if (!projectId || !projectService.findById(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const validData = createTicketSchema.parse(data);
    const ticket = ticketService.create(projectId, validData);
    
    broadcast({ type: 'ticket.created', projectId, ticket });
    logger.info({ ticketId: ticket.id, projectId }, 'Ticket created');
    
    res.status(201).json(ticket);
  } catch (err) {
    logger.error({ err }, 'Failed to create ticket');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.get('/:id', (req: Request, res: Response) => {
  const ticket = ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

ticketsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const validData = updateTicketSchema.parse(req.body);
    const ticket = ticketService.update(req.params.id, validData);
    
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
    const ticket = ticketService.update(req.params.id, { status });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    broadcast({ type: 'ticket.updated', projectId: ticket.projectId, ticket });
    logger.info({ ticketId: ticket.id, status }, 'Ticket moved');
    
    if (status === 'plan') {
      await aiAgentService.onTicketMovedToPlan(ticket.id);
    }
    
    res.json(ticket);
  } catch (err) {
    logger.error({ err }, 'Failed to move ticket');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.delete('/:id', (req: Request, res: Response) => {
  const ticket = ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const deleted = ticketService.delete(req.params.id);
  if (deleted) {
    broadcast({ type: 'ticket.deleted', projectId: ticket.projectId, ticketId: ticket.id });
    logger.info({ ticketId: ticket.id }, 'Ticket deleted');
  }

  res.status(204).send();
});

ticketsRouter.post('/:id/comments', (req: Request, res: Response) => {
  try {
    const ticket = ticketService.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { content, author } = createCommentSchema.parse(req.body);
    const comment = commentService.create(ticket.id, content, author);
    
    broadcast({ type: 'comment.created', projectId: ticket.projectId, ticketId: ticket.id, comment });
    logger.info({ commentId: comment.id, ticketId: ticket.id }, 'Comment created');
    
    res.status(201).json(comment);
  } catch (err) {
    logger.error({ err }, 'Failed to create comment');
    res.status(400).json({ error: 'Invalid request' });
  }
});

ticketsRouter.get('/:id/comments', (req: Request, res: Response) => {
  const ticket = ticketService.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const comments = commentService.findByTicket(ticket.id);
  res.json(comments);
});
