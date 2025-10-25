export type TicketStatus = 'To Do' | 'Plan' | 'In Progress' | 'Done';

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high';
  aiStatus?: 'pending' | 'analyzing' | 'completed' | 'failed';
  aiSuggestions?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    email: string;
    name: string;
  };
  comments?: Comment[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  tickets: Ticket[];
  project: Project | null;
  loading: boolean;
  error: string | null;
}

export type BoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'MOVE_TICKET'; payload: { ticketId: string; status: TicketStatus } }
  | { type: 'ADD_COMMENT'; payload: { ticketId: string; comment: Comment } };
