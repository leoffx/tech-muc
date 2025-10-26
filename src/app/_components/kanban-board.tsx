"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Id } from "../../../convex/_generated/dataModel";
import { type CSSProperties, useCallback, useMemo, useState } from "react";

import { cn } from "~/lib/utils";
import { AgentStatusBadge } from "./agent-status-badge";

const STATUSES = ["todo", "planning", "in-progress", "done"] as const;

export type TicketStatus = (typeof STATUSES)[number];

export const KANBAN_COLUMNS: Array<{
  id: TicketStatus;
  title: string;
  description: string;
}> = [
  {
    id: "todo",
    title: "Backlog",
    description: "Incoming and unprioritized work.",
  },
  {
    id: "planning",
    title: "Planning",
    description: "Tickets with plans underway.",
  },
  {
    id: "in-progress",
    title: "In Progress",
    description: "Actively being worked on.",
  },
  {
    id: "done",
    title: "Done",
    description: "Completed and ready to showcase.",
  },
];

export type AgentStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "failed"
  | undefined;

export type KanbanTicket = {
  _id: Id<"tickets">;
  title: string;
  description: string;
  status: TicketStatus;
  agentStatus?: AgentStatus;
};

type KanbanBoardProps = {
  tickets: KanbanTicket[];
  onMoveTicket: (
    ticketId: Id<"tickets">,
    status: TicketStatus,
  ) => Promise<void> | void;
  onTicketClick: (ticketId: Id<"tickets">) => void;
};

export function KanbanBoard({
  tickets,
  onMoveTicket,
  onTicketClick,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const [activeTicketId, setActiveTicketId] = useState<Id<"tickets"> | null>(
    null,
  );

  const ticketsByStatus = useMemo(() => {
    return KANBAN_COLUMNS.reduce<Record<TicketStatus, KanbanTicket[]>>(
      (acc, column) => {
        acc[column.id] = tickets.filter(
          (ticket) => ticket.status === column.id,
        );
        return acc;
      },
      { todo: [], planning: [], "in-progress": [], done: [] },
    );
  }, [tickets]);

  const ticketLookup = useMemo(() => {
    return new Map(tickets.map((ticket) => [ticket._id, ticket]));
  }, [tickets]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveTicketId(event.active.id as Id<"tickets">);
    },
    [setActiveTicketId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTicketId(null);
      if (!event.over) {
        return;
      }

      const ticketId = event.active.id as Id<"tickets">;
      const targetStatus = event.over.id as TicketStatus;
      const ticket = ticketLookup.get(ticketId);

      if (!ticket || ticket.status === targetStatus) {
        return;
      }

      void onMoveTicket(ticketId, targetStatus);
    },
    [onMoveTicket, ticketLookup],
  );

  const activeTicket = activeTicketId
    ? (ticketLookup.get(activeTicketId) ?? null)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid flex-1 grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tickets={ticketsByStatus[column.id]}
            onTicketClick={onTicketClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? <TicketCardPreview ticket={activeTicket} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

type ColumnProps = {
  column: (typeof KANBAN_COLUMNS)[number];
  tickets: KanbanTicket[];
  onTicketClick: (ticketId: Id<"tickets">) => void;
};

function Column({ column, tickets, onTicketClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-border bg-muted/30 flex min-h-[420px] flex-col rounded-lg border p-4 transition",
        isOver && "border-primary bg-muted shadow-sm",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            {column.title}
          </h2>
          <p className="text-muted-foreground text-xs">{column.description}</p>
        </div>
        <span className="bg-secondary text-secondary-foreground ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
          {tickets.length}
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto">
        {tickets.length === 0 ? (
          <p className="border-border bg-card/40 text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
            Drop tickets here
          </p>
        ) : (
          tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket._id}
              ticket={ticket}
              onClick={onTicketClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

type TicketCardProps = {
  ticket: KanbanTicket;
  onClick: (ticketId: Id<"tickets">) => void;
};

function DraggableTicketCard({ ticket, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ticket._id });

  const style = transform
    ? ({ transform: CSS.Translate.toString(transform) } as CSSProperties)
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-border bg-card focus:ring-ring rounded-lg border p-3 text-left shadow-sm transition focus:ring-2 focus:outline-none",
        isDragging
          ? "cursor-grab opacity-70 ring-0"
          : "hover:border-primary cursor-pointer",
      )}
      onClick={() => {
        if (!isDragging) onClick(ticket._id);
      }}
      {...attributes}
      {...listeners}
    >
      <TicketCardContent ticket={ticket} />
    </div>
  );
}

function TicketCardPreview({ ticket }: { ticket: KanbanTicket }) {
  return (
    <div className="border-border bg-card cursor-grabbing rounded-lg border p-3 text-left shadow-lg">
      <TicketCardContent ticket={ticket} />
    </div>
  );
}

function TicketCardContent({ ticket }: { ticket: KanbanTicket }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground line-clamp-2 flex-1 text-sm font-medium">
          {ticket.title}
        </p>
        {ticket.agentStatus && (
          <AgentStatusBadge status={ticket.agentStatus} size="sm" />
        )}
      </div>
      <p className="text-muted-foreground line-clamp-3 text-xs">
        {ticket.description}
      </p>
    </div>
  );
}

export { STATUSES as KANBAN_STATUSES };
