import { TicketDetailView } from "./ticket-detail-view";

export default function TicketPage({ params }: { params: { ticketId: string } }) {
  return <TicketDetailView ticketId={params.ticketId} />;
}

