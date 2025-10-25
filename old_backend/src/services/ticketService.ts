import { db } from '../db/client.js';
import { tickets } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'plan' | 'in_progress' | 'done';
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ticketService = {
  async create(projectId: string, data: Omit<Ticket, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values({
      projectId,
      title: data.title,
      description: data.description,
      status: data.status,
      assigneeId: data.assigneeId,
    }).returning();

    return {
      id: ticket.id,
      projectId: ticket.projectId,
      title: ticket.title,
      description: ticket.description || undefined,
      status: ticket.status as 'todo' | 'plan' | 'in_progress' | 'done',
      assigneeId: ticket.assigneeId || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  },

  async findById(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    
    if (!ticket) return undefined;

    return {
      id: ticket.id,
      projectId: ticket.projectId,
      title: ticket.title,
      description: ticket.description || undefined,
      status: ticket.status as 'todo' | 'plan' | 'in_progress' | 'done',
      assigneeId: ticket.assigneeId || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  },

  async findByProject(projectId: string): Promise<Ticket[]> {
    const result = await db.select().from(tickets).where(eq(tickets.projectId, projectId));
    
    return result.map(ticket => ({
      id: ticket.id,
      projectId: ticket.projectId,
      title: ticket.title,
      description: ticket.description || undefined,
      status: ticket.status as 'todo' | 'plan' | 'in_progress' | 'done',
      assigneeId: ticket.assigneeId || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));
  },

  async update(id: string, data: Partial<Omit<Ticket, 'id' | 'projectId' | 'createdAt'>>): Promise<Ticket | undefined> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    const [ticket] = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    if (!ticket) return undefined;

    return {
      id: ticket.id,
      projectId: ticket.projectId,
      title: ticket.title,
      description: ticket.description || undefined,
      status: ticket.status as 'todo' | 'plan' | 'in_progress' | 'done',
      assigneeId: ticket.assigneeId || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id)).returning();
    return result.length > 0;
  },
};
