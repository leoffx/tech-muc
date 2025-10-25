import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  author: string;
  kind: 'user' | 'ai';
  createdAt: Date;
}

const comments = new Map<string, Comment>();

export const commentService = {
  create(ticketId: string, content: string, author: string, kind: 'user' | 'ai' = 'user'): Comment {
    const comment: Comment = {
      id: uuidv4(),
      ticketId,
      content,
      author,
      kind,
      createdAt: new Date(),
    };
    comments.set(comment.id, comment);
    return comment;
  },

  findByTicket(ticketId: string): Comment[] {
    return Array.from(comments.values())
      .filter(c => c.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },
};
