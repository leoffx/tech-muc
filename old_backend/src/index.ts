import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { WSServer } from './ws/server.js';
import { setWSServer } from './ws/broadcaster.js';
import { projectsRouter } from './routes/projects.js';
import { boardRouter } from './routes/board.js';
import { ticketsRouter } from './routes/tickets.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api', boardRouter);
app.use('/api/tickets', ticketsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

const wsServer = new WSServer(server);
setWSServer(wsServer);

server.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server started');
});
