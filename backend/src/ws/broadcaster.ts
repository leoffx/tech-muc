import { WSServer } from './server';
import { ServerMessage } from './protocol';

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
