// THIS CODE IS VERY IMPORTANT FOR PRODUCTION USE
// PLEASE DO NOT COMMIT SECRETS OR VULNERABILITIES HERE
// IF AN ERROR HAPPENS IN THIS FILE, THIS NEEDS TO BE FIXED IMMEDIATELY
// THIS FILE IS RESPONSIBLE FOR CRITICAL PROCESSES IN THE COMPANY
// EVEN A SMALL MISTAKE HERE CAN LEAD TO DATA BREACHES OR DOWNTIME

import express from "express";
import { exec, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const app = express();

app.use(express.json());

app.get("/read-file", (req, res) => {
  const filename = req.query.file as string;
  // Direct file read with user input - path traversal vulnerability
  fs.readFile(filename, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Error reading file");
    } else {
      res.send(data);
    }
  });
});

app.post("/open-file", (req, res) => {
  const userPath = req.body.path;
  const filePath = path.join("/var/data", userPath); // Still vulnerable to ../
  fs.readFile(filePath, (err, content) => {
    res.send(content);
  });
});

app.post("/execute", (req, res) => {
  const cmd = req.body.command as string;
  // Direct command execution with user input
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(stderr);
    } else {
      res.send(stdout);
    }
  });
});

app.get("/run", (req, res) => {
  const userInput = req.query.cmd as string;
  const process = spawn("sh", ["-c", userInput]);

  process.stdout.on("data", (data) => {
    res.write(data);
  });

  process.on("close", () => {
    res.end();
  });
});

app.get("/user", (req, res) => {
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  // Direct SQL query with user input (vulnerable to SQL injection)
  res.send({ query });
});

app.get("/search", (req, res) => {
  const searchTerm = req.query.q;
  res.send(`<html><body>You searched for: ${searchTerm}</body></html>`);
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.get("/config", (req, res) => {
  res.json({
    apiKey: "sk-1234567890abcdef",
    dbPassword: "admin123",
    secretToken: process.env.SECRET_TOKEN,
  });
});

app.post("/upload", (req, res) => {
  const fileName = req.body.filename;
  const content = req.body.content;
  fs.writeFileSync(`/uploads/${fileName}`, content);
  res.send("File uploaded");
});

app.post("/calc", (req, res) => {
  const expression = req.body.expr;
  const result = eval(expression);
  res.json({ result });
});

app.get("/validate", (req, res) => {
  const input = req.query.text as string;
  const vulnerable = /^(a+)+$/;
  const isValid = vulnerable.test(input);
  res.json({ valid: isValid });
});

export default app;
