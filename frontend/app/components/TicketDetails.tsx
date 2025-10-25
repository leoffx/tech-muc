import { useState } from 'react';
import type { Ticket } from '../types/kanban';

interface TicketDetailsProps {
  ticket: Ticket | null;
  onClose: () => void;
  onAddComment: (ticketId: string, content: string) => Promise<void>;
}

export function TicketDetails({ ticket, onClose, onAddComment }: TicketDetailsProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(ticket.id, comment);
      setComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {ticket.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                  {ticket.status}
                </span>
                <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                  {ticket.priority} priority
                </span>
                {ticket.assignee && (
                  <span className="text-sm text-gray-600">
                    Assigned to {ticket.assignee.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.aiSuggestions && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">AI Suggestions</h3>
              <p className="text-blue-800 whitespace-pre-wrap">{ticket.aiSuggestions}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Comments ({ticket.comments?.length || 0})
            </h3>
            <div className="space-y-3">
              {ticket.comments?.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
