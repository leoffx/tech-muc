import { TicketDetailView } from "./ticket-detail-view";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketDetailView ticketId={ticketId} />;
}

