import { Droppable } from '@hello-pangea/dnd';
import { TicketCard } from './TicketCard';
import type { Ticket, TicketStatus } from '../types/kanban';

interface ColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function Column({ status, tickets, onTicketClick }: ColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-w-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">{status}</h2>
        <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
          {tickets.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                onClick={() => onTicketClick(ticket)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
