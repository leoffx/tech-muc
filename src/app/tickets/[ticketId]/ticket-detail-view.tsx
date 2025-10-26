"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

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
import { Textarea } from "~/app/_components/ui/textarea";
import { api } from "~/trpc/react";
import { AgentStatusBadge } from "~/app/_components/agent-status-badge";

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
  const createImplementation = api.plan.implement.useMutation();

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      const constrainedWidth = Math.min(Math.max(newWidth, 20), 80);
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      // Disable pointer events on iframe to prevent it from capturing mouse events
      if (iframeRef.current) {
        iframeRef.current.style.pointerEvents = "none";
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      // Re-enable pointer events on iframe
      if (iframeRef.current) {
        iframeRef.current.style.pointerEvents = "";
      }
    };
  }, [isResizing]);

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
  const hasPreview = Boolean(ticket.previewUrl);

  const ticketContent = (
    <div
      className={`flex flex-col gap-6 ${hasPreview ? "px-6 py-10" : "mx-auto max-w-6xl px-6 py-10"}`}
    >
      <div className="flex items-center gap-2">
        <Button
          onClick={() => router.push(projectHref)}
          className="h-9 w-9 p-0"
          aria-label="Back to board"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to board</span>
        </Button>
        <span className="text-muted-foreground text-sm">
          Ticket #{ticket._id}
        </span>
      </div>

     <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-3xl font-semibold">
            {ticket.title}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span>Project:</span>
            {project ? (
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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}
              >
                {statusLabels[status]}
              </span>
              {ticket.agentStatus && (
                <AgentStatusBadge status={ticket.agentStatus} size="md" />
              )}
            </div>
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Plan
              </span>
            </div>
            {ticket.plan ? (
              <div className="relative">
                <Button
                  onClick={() => createPlan.mutate({ ticketId })}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  aria-label="Regenerate plan"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <MarkdownContent
                  content={ticket.plan || ""}
                  className={`border-border bg-muted/50 rounded-md border p-4 ${ticket.agentStatus === "planning" ? "animate-pulse" : ""}`}
                />
              </div>
            ) : (
              <div
                className={`border-border bg-muted/50 rounded-md border p-4 ${ticket.agentStatus === "planning" ? "animate-pulse" : ""}`}
              >
                <p className="text-muted-foreground text-sm">
                  {ticket.agentStatus === "planning"
                    ? "Agent is creating a plan..."
                    : "No plan yet."}
                </p>
              </div>
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

      <Card className="py-6 pb-0">
        <CardContent className="relative">
          <Textarea
            placeholder="Describe the changes you want to make"
            className="min-h-[100px] resize-y"
          />
          <Button className="absolute right-10 bottom-8">
            <Send className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (hasPreview) {
    return (
      <div ref={containerRef} className="flex h-screen w-full">
        {/* Preview iframe on the left */}
        <div className="border-r" style={{ width: `${leftWidth}%` }}>
          <iframe
            ref={iframeRef}
            src={ticket.previewUrl}
            className="h-full w-full"
            title="Preview"
          />
        </div>

        {/* Resizable divider */}
        <div
          className="bg-border hover:bg-primary/50 w-1 cursor-col-resize transition-colors"
          onMouseDown={() => setIsResizing(true)}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
        />

        {/* Ticket details on the right */}
        <div
          className="overflow-y-auto"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {ticketContent}
        </div>
      </div>
    );
  }

  return <div className="w-full">{ticketContent}</div>;
}

function toTicketId(value: string): Id<"tickets"> {
  return value as Id<"tickets">;
}

function TicketDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
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
