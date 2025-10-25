export type ClientMessage = 
  | { type: 'subscribe'; projectId: string }
  | { type: 'unsubscribe'; projectId: string };

export type ServerMessage =
  | { type: 'ticket.created'; projectId: string; ticket: any }
  | { type: 'ticket.updated'; projectId: string; ticket: any }
  | { type: 'ticket.deleted'; projectId: string; ticketId: string }
  | { type: 'comment.created'; projectId: string; ticketId: string; comment: any }
  | { type: 'ai.status'; projectId: string; ticketId: string; status: string; data?: any }
  | { type: 'ai_job.created'; projectId: string; ticketId: string; job: any }
  | { type: 'ai_job.updated'; projectId: string; ticketId: string; job: any };
