import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { ClientMessage } from './protocol';

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

  private handleConnection(ws: ExtWebSocket) {
    const id = this.generateId();
    ws.id = id;
    ws.subscriptions = new Set();
    this.clients.set(id, ws);

    logger.info({ clientId: id }, 'Client connected');

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
