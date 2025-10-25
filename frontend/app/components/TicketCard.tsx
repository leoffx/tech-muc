import { Draggable } from "@hello-pangea/dnd";
import type { Ticket } from "../types/kanban";

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  onClick: () => void;
}

export function TicketCard({ ticket, index, onClick }: TicketCardProps) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const aiStatusColors = {
    pending: "bg-gray-100 text-gray-600",
    analyzing: "bg-blue-100 text-blue-600 animate-pulse",
    completed: "bg-green-100 text-green-600",
    failed: "bg-red-100 text-red-600",
  };

  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white p-4 rounded-lg shadow mb-3 cursor-pointer hover:shadow-md line-clamp-3 transition-shadow ${
            snapshot.isDragging ? "shadow-lg" : ""
          }`}
        >
          <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {ticket.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-1 rounded ${
                priorityColors[ticket.priority]
              }`}
            >
              {ticket.priority}
            </span>

            {ticket.status === "Plan" && ticket.aiStatus && (
              <span
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                  aiStatusColors[ticket.aiStatus]
                }`}
              >
                {ticket.aiStatus === "analyzing" && (
                  <svg
                    className="w-3 h-3 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                AI {ticket.aiStatus}
              </span>
            )}

            {ticket.assignee && (
              <span className="text-xs text-gray-500">
                {ticket.assignee.name}
              </span>
            )}

            {ticket.comments && ticket.comments.length > 0 && (
              <span className="text-xs text-gray-500 ml-auto">
                💬 {ticket.comments.length}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
