import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { logger } from '../utils/logger.js';
import { ClientMessage } from './protocol.js';

export interface ExtWebSocket extends WebSocket {
  id: string;
  subscriptions: Set<string>;
}

export class WSServer {
  private wss: WebSocketServer;
  private clients = new Map<string, ExtWebSocket>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  private handleConnection(rawWs: WebSocket, req: IncomingMessage) {
    const ws = rawWs as ExtWebSocket;
    const id = this.generateId();
    ws.id = id;
    ws.subscriptions = new Set();
    this.clients.set(id, ws);

    logger.info({ clientId: id }, 'Client connected');
    const requestUrl = req.url ?? '';
    try {
      const parsedUrl = new URL(requestUrl, 'http://localhost');
      const projectId = parsedUrl.searchParams.get('projectId');
      if (projectId) {
        ws.subscriptions.add(projectId);
        logger.debug({ clientId: id, projectId }, 'Client auto-subscribed via URL');
      }
    } catch (err) {
      logger.warn({ err, clientId: id, url: requestUrl }, 'Failed to parse subscription from URL');
    }

    ws.on('message', (data) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        logger.error({ err, clientId: id }, 'Invalid message');
      }
    });

    ws.on('close', () => {
      this.clients.delete(id);
      logger.info({ clientId: id }, 'Client disconnected');
    });

    ws.on('error', (err) => {
      logger.error({ err, clientId: id }, 'WebSocket error');
    });
  }

  private handleMessage(ws: ExtWebSocket, message: ClientMessage) {
    switch (message.type) {
      case 'subscribe':
        ws.subscriptions.add(message.projectId);
        logger.debug({ clientId: ws.id, projectId: message.projectId }, 'Client subscribed');
        break;
      case 'unsubscribe':
        ws.subscriptions.delete(message.projectId);
        logger.debug({ clientId: ws.id, projectId: message.projectId }, 'Client unsubscribed');
        break;
    }
  }

  broadcast(projectId: string, message: any) {
    const data = JSON.stringify(message);
    let sent = 0;

    this.clients.forEach((client) => {
      if (client.subscriptions.has(projectId) && client.readyState === WebSocket.OPEN) {
        client.send(data);
        sent++;
      }
    });

    logger.debug({ projectId, sent, type: message.type }, 'Broadcast message');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
