"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  KanbanBoard,
  KANBAN_COLUMNS,
  type KanbanTicket,
  type TicketStatus,
} from "~/app/_components/kanban-board";
import { Button } from "~/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/app/_components/ui/dialog";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/app/_components/ui/select";
import { Textarea } from "~/app/_components/ui/textarea";
import { Skeleton } from "~/app/_components/ui/skeleton";
import { api as trpcApi } from "~/trpc/react";

type ProjectDetailViewProps = {
  projectId: string;
};

type CreateTicketFormState = {
  title: string;
  description: string;
  status: TicketStatus;
  authorId: Id<"authors"> | "";
};

const emptyFormState: CreateTicketFormState = {
  title: "",
  description: "",
  status: "todo",
  authorId: "",
};

const statusLabels: Record<TicketStatus, string> = Object.fromEntries(
  KANBAN_COLUMNS.map((column) => [column.id, column.title]),
) as Record<TicketStatus, string>;

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const projectIdAsId = projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId: projectIdAsId });
  const tickets = useQuery(api.tickets.listByProject, {
    projectId: projectIdAsId,
  });
  const authors = useQuery(api.authors.list);

  const createTicket = useMutation(api.tickets.create);
  const updateTicketStatus = useMutation(api.tickets.updateStatus);

  const createPlan = trpcApi.plan.create.useMutation();
  const createImplementation = trpcApi.plan.implement.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] =
    useState<CreateTicketFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);

    if (open) {
      setFormState({
        title: "",
        description: "",
        status: "todo",
        authorId: authors?.[0]?._id ?? "",
      });
    }
  };

  const handleCreateTicket = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const { authorId } = formState;
    if (!formState.title.trim() || !formState.description.trim() || !authorId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket({
        title: formState.title.trim(),
        description: formState.description.trim(),
        status: formState.status,
        projectId: projectIdAsId,
        authorId,
      });

      setIsDialogOpen(false);
      setFormState(emptyFormState);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketClick = (ticketId: Id<"tickets">) => {
    router.push(`/tickets/${ticketId}`);
  };

  const handleMoveTicket = async (
    ticketId: Id<"tickets">,
    status: TicketStatus,
  ) => {
    await updateTicketStatus({ ticketId, status });

    // Trigger planning when moved to planning column
    if (status === "planning") {
      createPlan.mutate({ ticketId });
    }

    // Trigger implementation when moved to in-progress column
    if (status === "in-progress") {
      createImplementation.mutate({ ticketId });
    }
  };

  const kanbanTickets: KanbanTicket[] = useMemo(() => {
    return (tickets ?? []).map((ticket) => ({
      _id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      agentStatus: ticket.agentStatus,
    }));
  }, [tickets]);

  const hasAuthors = (authors?.length ?? 0) > 0;
  const isLoading =
    project === undefined || tickets === undefined || authors === undefined;

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 text-center">
        <h1 className="text-foreground text-2xl font-semibold">
          Project not found
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-3xl font-semibold">
              {project.title}
            </h1>
          </div>
          <div className="text-muted-foreground mt-2 text-sm">
            <span>Repository: </span>
            <Link
              href={project.githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground font-medium underline underline-offset-4"
            >
              {project.githubRepoUrl}
            </Link>
          </div>
          <div className="text-muted-foreground mt-2 text-sm">
            {kanbanTickets.length} ticket{kanbanTickets.length === 1 ? "" : "s"}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={!hasAuthors}>New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a ticket</DialogTitle>
              <DialogDescription>
                Capture the work that needs to happen for this project.
              </DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleCreateTicket}>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Build onboarding flow"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Outline the user journey, required components, and dependencies."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((state) => ({
                      ...state,
                      status: value as TicketStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {statusLabels[column.id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Author</Label>
                <Select
                  value={formState.authorId}
                  onValueChange={(value) =>
                    setFormState((state) => ({
                      ...state,
                      authorId: value as Id<"authors">,
                    }))
                  }
                  disabled={!hasAuthors}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an author" />
                  </SelectTrigger>
                  <SelectContent>
                    {(authors ?? []).map((author) => (
                      <SelectItem key={author._id} value={author._id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasAuthors ? (
                  <p className="text-muted-foreground text-xs">
                    You need at least one author in Convex to create tickets.
                  </p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={
                    !hasAuthors ||
                    isSubmitting ||
                    !formState.title.trim() ||
                    !formState.description.trim()
                  }
                >
                  {isSubmitting ? "Creating…" : "Create ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <KanbanBoard
        tickets={kanbanTickets}
        onMoveTicket={handleMoveTicket}
        onTicketClick={handleTicketClick}
      />
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <KanbanBoardSkeleton />
    </div>
  );
}

function KanbanBoardSkeleton() {
  return (
    <div className="grid flex-1 grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.id}
          className="border-border bg-muted/30 flex min-h-[420px] flex-col rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="mt-4 flex flex-1 flex-col gap-3">
            {Array.from({ length: 3 }).map((_, ticketIndex) => (
              <div
                key={ticketIndex}
                className="border-border bg-card/90 space-y-2 rounded-lg border p-4 shadow-sm"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
