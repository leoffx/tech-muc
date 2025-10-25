import { createContext, useReducer, type ReactNode } from 'react';
import type { BoardState, BoardAction, Ticket, Project, Comment, TicketStatus } from '../types/kanban';

const initialState: BoardState = {
  tickets: [],
  project: null,
  loading: false,
  error: null,
};

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload, loading: false };
    case 'ADD_TICKET':
      return { ...state, tickets: [...state.tickets, action.payload] };
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'MOVE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.ticketId
            ? { ...t, status: action.payload.status }
            : t
        ),
      };
    case 'REMOVE_TICKET':
      return {
        ...state,
        tickets: state.tickets.filter((t) => t.id !== action.payload),
      };
    case 'SET_TICKET_AI_STATUS':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.ticketId
            ? { ...t, aiStatus: action.payload.status }
            : t
        ),
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.ticketId
            ? {
                ...t,
                comments: t.comments?.some(c => c.id === action.payload.comment.id)
                  ? t.comments
                  : [...(t.comments || []), action.payload.comment],
              }
            : t
        ),
      };
    default:
      return state;
  }
}

interface BoardContextValue {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
}

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}
