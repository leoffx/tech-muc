"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api as convexApi } from "../../../../convex/_generated/api";
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
import { api } from "~/trpc/react";

type TicketDetailViewProps = {
  ticketId: string;
};

const statusLabels: Record<TicketStatus, string> = Object.fromEntries(
  KANBAN_COLUMNS.map((column) => [column.id, column.title]),
) as Record<TicketStatus, string>;

const STATUS_COLORS: Record<TicketStatus, string> = {
  todo: "bg-slate-200 text-slate-700",
  planning: "bg-blue-200 text-blue-800",
  "in-progress": "bg-amber-200 text-amber-800",
  done: "bg-emerald-200 text-emerald-800",
};

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const router = useRouter();
  const ticket = useQuery(convexApi.tickets.get, { ticketId: toTicketId(ticketId) });
  const author = useQuery(
    convexApi.authors.get,
    ticket ? { authorId: ticket.author } : "skip",
  );
  const project = useQuery(
    convexApi.projects.get,
    ticket ? { projectId: ticket.projectId } : "skip",
  );

  const createPlan = api.plan.create.useMutation();

  useEffect(() => {
    if (ticketId) {
      createPlan.mutate({ ticketId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (ticket === undefined) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ticket not found
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-slate-900 underline underline-offset-4"
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
        <span className="text-sm text-slate-500">Ticket #{ticket._id}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-slate-900">
            {ticket.title}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span>Project:</span>
            {project === undefined ? (
              <Skeleton className="h-4 w-40" />
            ) : project ? (
              <Link
                href={projectHref}
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                {project.title}
              </Link>
            ) : (
              <span className="text-slate-500">Unknown project</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Status
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Description
            </span>
            <p className="text-sm whitespace-pre-line text-slate-700">
              {ticket.description}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Plan
            </span>
            {ticket.plan ? (
              <MarkdownContent
                content={ticket.plan}
                className="rounded-md border border-slate-200 bg-slate-50/80 p-4"
              />
            ) : (
              <p className="text-sm text-slate-500">No plan yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Author
            </span>
            {author === undefined ? (
              <Skeleton className="h-4 w-32" />
            ) : author ? (
              <div className="text-sm text-slate-700">{author.name}</div>
            ) : (
              <p className="text-sm text-slate-500">Unknown author</p>
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
