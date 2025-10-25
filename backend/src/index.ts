import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { WSServer } from './ws/server';
import { setWSServer } from './ws/broadcaster';
import { projectsRouter } from './routes/projects';
import { boardRouter } from './routes/board';
import { ticketsRouter } from './routes/tickets';

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
