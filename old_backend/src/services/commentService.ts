import { db } from '../db/client.js';
import { ticketComments } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

export interface Comment {
  id: string;
  ticketId: string;
  body: string;
  authorId: string | null;
  kind: 'user' | 'ai';
  createdAt: Date;
}

export const commentService = {
  async create(ticketId: string, content: string, author: string, kind: 'user' | 'ai' = 'user'): Promise<Comment> {
    const [comment] = await db.insert(ticketComments).values({
      ticketId,
      body: content,
      authorId: author,
      kind,
    }).returning();

    return {
      id: comment.id,
      ticketId: comment.ticketId,
      body: comment.body,
      authorId: comment.authorId,
      kind: comment.kind as 'user' | 'ai',
      createdAt: comment.createdAt,
    };
  },

  async findByTicket(ticketId: string): Promise<Comment[]> {
    const result = await db.select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(ticketComments.createdAt);

    return result.map(comment => ({
      id: comment.id,
      ticketId: comment.ticketId,
      body: comment.body,
      authorId: comment.authorId,
      kind: comment.kind as 'user' | 'ai',
      createdAt: comment.createdAt,
    }));
  },

  async findByTickets(ticketIds: string[]): Promise<Record<string, Comment[]>> {
    if (ticketIds.length === 0) {
      return {};
    }

    const result = await db.select()
      .from(ticketComments)
      .where(inArray(ticketComments.ticketId, ticketIds))
      .orderBy(ticketComments.createdAt);

    return result.reduce<Record<string, Comment[]>>((acc, comment) => {
      const mappedComment: Comment = {
        id: comment.id,
        ticketId: comment.ticketId,
        body: comment.body,
        authorId: comment.authorId,
        kind: comment.kind as 'user' | 'ai',
        createdAt: comment.createdAt,
      };

      if (!acc[mappedComment.ticketId]) {
        acc[mappedComment.ticketId] = [];
      }
      acc[mappedComment.ticketId].push(mappedComment);
      return acc;
    }, {});
  },
};
