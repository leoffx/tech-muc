import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const commentKindEnum = pgEnum('comment_kind', ['user', 'ai']);
export const jobStatusEnum = pgEnum('job_status', ['queued', 'running', 'done', 'error']);
export const ticketStatusEnum = pgEnum('ticket_status', ['todo', 'plan', 'in_progress', 'done']);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  githubUrl: text('github_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: ticketStatusEnum('status').default('todo').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id),
  authorId: uuid('author_id').references(() => users.id),
  kind: commentKindEnum('kind').default('user').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiJobs = pgTable('ai_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().unique().references(() => tickets.id),
  status: jobStatusEnum('status').default('queued').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
