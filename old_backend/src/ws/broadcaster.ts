import { WSServer } from './server.js';
import { ServerMessage } from './protocol.js';

let wsServer: WSServer | null = null;

export function setWSServer(server: WSServer) {
  wsServer = server;
}

export function broadcast(message: ServerMessage) {
  if (!wsServer) {
    return;
  }
  wsServer.broadcast(message.projectId, message);
}
