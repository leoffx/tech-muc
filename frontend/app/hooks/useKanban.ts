import { useContext, useEffect, useRef } from 'react';
import { BoardContext } from '../contexts/BoardContext';
import type { TicketStatus, Ticket } from '../types/kanban';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function toFrontendStatus(backendStatus: string): TicketStatus {
  const statusMap: Record<string, TicketStatus> = {
    'todo': 'To Do',
    'plan': 'Plan',
    'in_progress': 'In Progress',
    'done': 'Done',
  };
  return statusMap[backendStatus] || 'To Do';
}

function toBackendStatus(frontendStatus: TicketStatus): string {
  const statusMap: Record<TicketStatus, string> = {
    'To Do': 'todo',
    'Plan': 'plan',
    'In Progress': 'in_progress',
    'Done': 'done',
  };
  return statusMap[frontendStatus] || 'todo';
}

export function useKanban(projectId: string) {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useKanban must be used within BoardProvider');
  }

  const { state, dispatch } = context;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchBoard();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe', projectId }));
        }
        wsRef.current.close();
      }
    };
  }, [projectId]);

  async function fetchBoard() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [projectRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/api/projects/${projectId}`),
        fetch(`${API_URL}/api/tickets?projectId=${projectId}`),
      ]);

      if (!projectRes.ok || !ticketsRes.ok) {
        throw new Error('Failed to fetch board data');
      }

      const project = await projectRes.json();
      const backendTickets = await ticketsRes.json();
      
      const tickets = backendTickets.map((ticket: any) => ({
        ...ticket,
        status: toFrontendStatus(ticket.status),
      }));

      dispatch({ type: 'SET_PROJECT', payload: project });
      dispatch({ type: 'SET_TICKETS', payload: tickets });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  function connectWebSocket() {
    const ws = new WebSocket(`${WS_URL}/ws?projectId=${projectId}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', projectId }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'ticket.updated': {
          const ticket = {
            ...message.ticket,
            status: toFrontendStatus(message.ticket.status),
          };
          dispatch({ type: 'UPDATE_TICKET', payload: ticket });
          break;
        }
        case 'ticket.created': {
          const ticket = {
            ...message.ticket,
            status: toFrontendStatus(message.ticket.status),
          };
          dispatch({ type: 'ADD_TICKET', payload: ticket });
          break;
        }
        case 'ticket.deleted': {
          dispatch({ type: 'REMOVE_TICKET', payload: message.ticketId });
          break;
        }
        case 'comment.created': {
          dispatch({
            type: 'ADD_COMMENT',
            payload: {
              ticketId: message.ticketId,
              comment: {
                id: message.comment.id,
                ticketId: message.comment.ticketId,
                userId: message.comment.authorId,
                content: message.comment.body,
                createdAt: message.comment.createdAt,
              },
            },
          });
          break;
        }
        case 'ai_job.created':
        case 'ai_job.updated': {
          const statusMap: Record<string, Ticket['aiStatus']> = {
            queued: 'pending',
            running: 'analyzing',
            done: 'completed',
            error: 'failed',
          };
          const aiStatus = statusMap[message.job.status];
          if (aiStatus) {
            dispatch({
              type: 'SET_TICKET_AI_STATUS',
              payload: { ticketId: message.ticketId, status: aiStatus },
            });
          }
          break;
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }

  async function moveTicket(ticketId: string, newStatus: TicketStatus) {
    dispatch({ type: 'MOVE_TICKET', payload: { ticketId, status: newStatus } });

    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toBackendStatus(newStatus) }),
      });

      if (!response.ok) {
        fetchBoard();
        throw new Error('Failed to update ticket');
      }

      const backendTicket = await response.json();
      const updatedTicket = {
        ...backendTicket,
        status: toFrontendStatus(backendTicket.status),
      };
      dispatch({ type: 'UPDATE_TICKET', payload: updatedTicket });
    } catch (error) {
      console.error('Failed to move ticket:', error);
      fetchBoard();
    }
  }

  async function createTicket(data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }) {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const backendTicket = await response.json();
      const ticket = {
        ...backendTicket,
        status: toFrontendStatus(backendTicket.status),
      };
      dispatch({ type: 'ADD_TICKET', payload: ticket });
      return ticket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  }

  async function addComment(ticketId: string, content: string) {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author: 'user' }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const backendComment = await response.json();
      const comment = {
        ...backendComment,
        content: backendComment.body,
        userId: backendComment.authorId,
      };
      dispatch({ type: 'ADD_COMMENT', payload: { ticketId, comment } });
      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  return {
    ...state,
    moveTicket,
    createTicket,
    addComment,
    refetch: fetchBoard,
  };
}
