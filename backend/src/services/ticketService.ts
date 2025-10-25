import { v4 as uuidv4 } from 'uuid';

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'plan' | 'in-progress' | 'done';
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tickets = new Map<string, Ticket>();

export const ticketService = {
  create(projectId: string, data: Omit<Ticket, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Ticket {
    const ticket: Ticket = {
      id: uuidv4(),
      projectId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tickets.set(ticket.id, ticket);
    return ticket;
  },

  findById(id: string): Ticket | undefined {
    return tickets.get(id);
  },

  findByProject(projectId: string): Ticket[] {
    return Array.from(tickets.values()).filter(t => t.projectId === projectId);
  },

  update(id: string, data: Partial<Omit<Ticket, 'id' | 'projectId' | 'createdAt'>>): Ticket | undefined {
    const ticket = tickets.get(id);
    if (!ticket) return undefined;

    const updated = {
      ...ticket,
      ...data,
      updatedAt: new Date(),
    };
    tickets.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return tickets.delete(id);
  },
};
