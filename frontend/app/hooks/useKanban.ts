import { useContext, useEffect, useRef } from 'react';
import { BoardContext } from '../contexts/BoardContext';
import type { TicketStatus, Ticket } from '../types/kanban';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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
      const tickets = await ticketsRes.json();

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

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'ticket:updated':
          dispatch({ type: 'UPDATE_TICKET', payload: message.data });
          break;
        case 'ticket:created':
          dispatch({ type: 'ADD_TICKET', payload: message.data });
          break;
        case 'comment:created':
          dispatch({
            type: 'ADD_COMMENT',
            payload: {
              ticketId: message.data.ticketId,
              comment: message.data,
            },
          });
          break;
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
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        fetchBoard();
        throw new Error('Failed to update ticket');
      }

      const updatedTicket = await response.json();
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

      const ticket = await response.json();
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
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const comment = await response.json();
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
