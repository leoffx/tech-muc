"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api, api as convexApi } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  KANBAN_COLUMNS,
  type TicketStatus,
} from "~/app/_components/kanban-board";
import { MarkdownContent } from "~/app/_components/markdown-content";
import { Button } from "~/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import { Skeleton } from "~/app/_components/ui/skeleton";

type TicketDetailViewProps = {
  ticketId: string;
};

const statusLabels: Record<TicketStatus, string> = Object.fromEntries(
  KANBAN_COLUMNS.map((column) => [column.id, column.title]),
) as Record<TicketStatus, string>;

const STATUS_COLORS: Record<TicketStatus, string> = {
  todo: "bg-secondary text-secondary-foreground",
  planning: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "in-progress": "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
};

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const router = useRouter();
  const ticket = useQuery(convexApi.tickets.get, {
    ticketId: toTicketId(ticketId),
  });
  const author = useQuery(
    convexApi.authors.get,
    ticket ? { authorId: ticket.author } : "skip",
  );
  const project = useQuery(
    convexApi.projects.get,
    ticket ? { projectId: ticket.projectId } : "skip",
  );

  const createPlan = api.plan.create.useMutation();

  if (ticket === undefined) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 text-center">
        <h1 className="text-foreground text-2xl font-semibold">
          Ticket not found
        </h1>
        <Link
          href="/"
          className="text-foreground text-sm font-medium underline underline-offset-4"
        >
          Go back to projects
        </Link>
      </div>
    );
  }

  const status: TicketStatus = ticket.status;
  const projectHref = `/projects/${ticket.projectId}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.push(projectHref)} className="px-3">
          Back to board
        </Button>
        <span className="text-muted-foreground text-sm">
          Ticket #{ticket._id}
        </span>
      </div>

      <Button onClick={() => createPlan.mutate({ ticketId })}>
        {" "}
        Regenerate Plan
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-3xl font-semibold">
            {ticket.title}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span>Project:</span>
            {project === undefined ? (
              <Skeleton className="h-4 w-40" />
            ) : project ? (
              <Link
                href={projectHref}
                className="text-foreground font-medium underline underline-offset-4"
              >
                {project.title}
              </Link>
            ) : (
              <span className="text-muted-foreground">Unknown project</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-wide uppercase">
              Status
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Description
            </span>
            <p className="text-foreground/80 text-sm whitespace-pre-line">
              {ticket.description}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Plan
            </span>
            {ticket.plan ? (
              <MarkdownContent
                content={ticket.plan}
                className="border-border bg-muted/50 rounded-md border p-4"
              />
            ) : (
              <p className="text-muted-foreground text-sm">No plan yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Author
            </span>
            {author === undefined ? (
              <Skeleton className="h-4 w-32" />
            ) : author ? (
              <div className="text-foreground/80 text-sm">{author.name}</div>
            ) : (
              <p className="text-muted-foreground text-sm">Unknown author</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function toTicketId(value: string): Id<"tickets"> {
  return value as Id<"tickets">;
}

function TicketDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
