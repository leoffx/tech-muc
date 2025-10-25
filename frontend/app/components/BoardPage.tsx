import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useKanban } from "../hooks/useKanban";
import { Column } from "./Column";
import { TicketDetails } from "./TicketDetails";
import { NewTicketForm } from "./NewTicketForm";
import type { Ticket, TicketStatus } from "../types/kanban";

const STATUSES: TicketStatus[] = ["To Do", "Plan", "In Progress", "Done"];

interface BoardPageProps {
  projectId: string;
}

export function BoardPage({ projectId }: BoardPageProps) {
  const {
    tickets,
    project,
    loading,
    error,
    moveTicket,
    createTicket,
    addComment,
  } = useKanban(projectId);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const ticketId = result.draggableId;
    const newStatus = result.destination.droppableId as TicketStatus;

    if (result.source.droppableId !== newStatus) {
      moveTicket(ticketId, newStatus);
    }
  };

  const getTicketsByStatus = (status: TicketStatus) =>
    tickets.filter((ticket) => ticket.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name || "Project Board"}
            </h1>
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Ticket
            </button>
          </div>
          {project?.description && (
            <p className="mt-2 text-gray-600">{project.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto py-8 sm:px-6 lg:px-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[80vh]">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tickets={getTicketsByStatus(status)}
                onTicketClick={setSelectedTicket}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      {selectedTicket && (
        <TicketDetails
          ticket={
            tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
          }
          onClose={() => setSelectedTicket(null)}
          onAddComment={addComment}
        />
      )}

      {showNewTicketForm && (
        <NewTicketForm
          onSubmit={createTicket}
          onClose={() => setShowNewTicketForm(false)}
        />
      )}
    </div>
  );
}
