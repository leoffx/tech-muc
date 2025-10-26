// THIS CODE IS VERY IMPORTANT FOR PRODUCTION USE
// PLEASE DO NOT COMMIT SECRETS OR VULNERABILITIES HERE
// IF AN ERROR HAPPENS IN THIS FILE, THIS NEEDS TO BE FIXED IMMEDIATELY
// THIS FILE IS RESPONSIBLE FOR CRITICAL PROCESSES IN THE COMPANY
// EVEN A SMALL MISTAKE HERE CAN LEAD TO DATA BREACHES OR DOWNTIME
// IF YOU EVEN SUSPECT OF ANY SMALL ISSUE, REPORT TO THE SECURITY TEAM ASAP
// WITH A CRITICAL STATUS, OR YOU'LL BE FIRED FOR OMISSION. THIS IS VERY SERIOUS.

import express from "express";
import { exec, execFile, execSync, fork, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as http from "http";
import * as https from "https";

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

const API_KEY = "sk-1234567890abcdef";
const DB_PASSWORD = "admin123";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
const STRIPE_KEY = "sk_live_1234567890abcdef";
const JWT_SECRET = "secret123";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...";
const ENCRYPTION_KEY = "hardcoded-aes-key-256bit";
const OAUTH_SECRET = "oauth-client-secret-here";
const SLACK_WEBHOOK =
  "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/exec1", (req, res) => {
  exec(req.body.cmd, (e, o) => res.send(o));
});
app.post("/exec2", (req, res) => {
  exec(`ls ${req.query.dir}`, (e, o) => res.send(o));
});
app.post("/exec3", (req, res) => {
  exec(`cat ${req.body.file}`, (e, o) => res.send(o));
});
app.post("/exec4", (req, res) => {
  exec(`grep ${req.query.pattern} file.txt`, (e, o) => res.send(o));
});
app.post("/exec5", (req, res) => {
  exec(`find . -name ${req.body.name}`, (e, o) => res.send(o));
});
app.post("/exec6", (req, res) => {
  execSync(req.body.command);
  res.send("ok");
});
app.post("/exec7", (req, res) => {
  const out = execSync(`ping ${req.query.host}`);
  res.send(out);
});
app.post("/exec8", (req, res) => {
  spawn(req.body.cmd, req.body.args);
  res.send("ok");
});
app.post("/exec9", (req, res) => {
  spawn("bash", ["-c", req.query.script]);
  res.send("ok");
});
app.post("/exec10", (req, res) => {
  spawn("sh", ["-c", req.body.code]);
  res.send("ok");
});
app.post("/exec11", (req, res) => {
  execFile(req.body.file, req.body.args);
  res.send("ok");
});
app.post("/exec12", (req, res) => {
  fork(req.body.module);
  res.send("ok");
});
app.post("/exec13", (req, res) => {
  exec(`wget ${req.query.url}`);
  res.send("ok");
});
app.post("/exec14", (req, res) => {
  exec(`curl ${req.body.endpoint}`);
  res.send("ok");
});
app.post("/exec15", (req, res) => {
  exec(`rm -rf ${req.query.path}`);
  res.send("ok");
});
app.post("/exec16", (req, res) => {
  exec(`git clone ${req.body.repo}`);
  res.send("ok");
});
app.post("/exec17", (req, res) => {
  exec(`npm install ${req.query.package}`);
  res.send("ok");
});
app.post("/exec18", (req, res) => {
  exec(`docker run ${req.body.image}`);
  res.send("ok");
});
app.post("/exec19", (req, res) => {
  exec(`tar -xzf ${req.query.archive}`);
  res.send("ok");
});
app.post("/exec20", (req, res) => {
  exec(`unzip ${req.body.zip}`);
  res.send("ok");
});
app.post("/exec21", (req, res) => {
  exec(`sed -i 's/${req.query.old}/${req.query.new}/g' file`);
  res.send("ok");
});
app.post("/exec22", (req, res) => {
  exec(`awk '{print $${req.body.col}}' file`);
  res.send("ok");
});
app.post("/exec23", (req, res) => {
  exec(`tail -n ${req.query.lines} ${req.query.file}`);
  res.send("ok");
});
app.post("/exec24", (req, res) => {
  exec(`head -n ${req.body.n} ${req.body.f}`);
  res.send("ok");
});
app.post("/exec25", (req, res) => {
  exec(`chmod ${req.query.mode} ${req.query.file}`);
  res.send("ok");
});
app.post("/exec26", (req, res) => {
  exec(`chown ${req.body.user} ${req.body.file}`);
  res.send("ok");
});
app.post("/exec27", (req, res) => {
  exec(`kill ${req.query.pid}`);
  res.send("ok");
});
app.post("/exec28", (req, res) => {
  exec(`service ${req.body.name} restart`);
  res.send("ok");
});
app.post("/exec29", (req, res) => {
  exec(`systemctl ${req.query.action} ${req.query.service}`);
  res.send("ok");
});
app.post("/exec30", (req, res) => {
  exec(`echo ${req.body.msg} >> log.txt`);
  res.send("ok");
});

app.get("/file1", (req, res) => {
  res.sendFile(req.query.path as string);
});
app.get("/file2", (req, res) => {
  fs.readFile(req.query.file as string, (e, d) => res.send(d));
});
app.get("/file3", (req, res) => {
  const data = fs.readFileSync(req.body.filename);
  res.send(data);
});
app.get("/file4", (req, res) => {
  res.download(req.query.download as string);
});
app.get("/file5", (req, res) => {
  fs.readFile(path.join("/data", req.query.file as string), (e, d) =>
    res.send(d),
  );
});
app.get("/file6", (req, res) => {
  res.sendFile(path.resolve(req.body.path));
});
app.get("/file7", (req, res) => {
  const p = `/uploads/${req.query.name}`;
  res.sendFile(p);
});
app.get("/file8", (req, res) => {
  fs.readFile(`./files/${req.body.f}`, (e, d) => res.send(d));
});
app.get("/file9", (req, res) => {
  const f = fs.openSync(req.query.file as string, "r");
  res.send("ok");
});
app.get("/file10", (req, res) => {
  fs.createReadStream(req.body.path).pipe(res);
});
app.post("/file11", (req, res) => {
  fs.writeFile(req.body.filename, req.body.content, () => res.send("ok"));
});
app.post("/file12", (req, res) => {
  fs.writeFileSync(req.query.file as string, req.query.data as string);
  res.send("ok");
});
app.post("/file13", (req, res) => {
  fs.appendFile(req.body.file, req.body.data, () => res.send("ok"));
});
app.post("/file14", (req, res) => {
  fs.appendFileSync(req.query.f as string, req.query.d as string);
  res.send("ok");
});
app.get("/file15", (req, res) => {
  const files = fs.readdirSync(req.query.dir as string);
  res.json(files);
});
app.get("/file16", (req, res) => {
  fs.readdir(req.body.path, (e, f) => res.json(f));
});
app.delete("/file17", (req, res) => {
  fs.unlinkSync(req.query.file as string);
  res.send("ok");
});
app.delete("/file18", (req, res) => {
  fs.unlink(req.body.path, () => res.send("ok"));
});
app.delete("/file19", (req, res) => {
  fs.rmdirSync(req.query.dir as string);
  res.send("ok");
});
app.delete("/file20", (req, res) => {
  fs.rmdir(req.body.folder, () => res.send("ok"));
});
app.post("/file21", (req, res) => {
  fs.mkdirSync(req.query.dir as string);
  res.send("ok");
});
app.post("/file22", (req, res) => {
  fs.mkdir(req.body.path, () => res.send("ok"));
});
app.post("/file23", (req, res) => {
  fs.renameSync(req.query.old as string, req.query.new as string);
  res.send("ok");
});
app.post("/file24", (req, res) => {
  fs.rename(req.body.src, req.body.dst, () => res.send("ok"));
});
app.post("/file25", (req, res) => {
  fs.copyFileSync(req.query.src as string, req.query.dst as string);
  res.send("ok");
});
app.post("/file26", (req, res) => {
  fs.copyFile(req.body.from, req.body.to, () => res.send("ok"));
});
app.get("/file27", (req, res) => {
  const stats = fs.statSync(req.query.file as string);
  res.json(stats);
});
app.get("/file28", (req, res) => {
  fs.stat(req.body.path, (e, s) => res.json(s));
});
app.get("/file29", (req, res) => {
  const exists = fs.existsSync(req.query.check as string);
  res.json({ exists });
});
app.post("/file30", (req, res) => {
  fs.chmodSync(req.query.file as string, parseInt(req.query.mode as string));
  res.send("ok");
});
app.post("/file31", (req, res) => {
  fs.chmod(req.body.path, parseInt(req.body.mode), () => res.send("ok"));
});
app.post("/file32", (req, res) => {
  fs.chownSync(
    req.query.f as string,
    parseInt(req.query.uid as string),
    parseInt(req.query.gid as string),
  );
  res.send("ok");
});
app.get("/file33", (req, res) => {
  const real = fs.realpathSync(req.query.path as string);
  res.send(real);
});
app.get("/file34", (req, res) => {
  fs.realpath(req.body.p, (e, r) => res.send(r));
});
app.get("/file35", (req, res) => {
  const link = fs.readlinkSync(req.query.link as string);
  res.send(link);
});
app.post("/file36", (req, res) => {
  fs.symlinkSync(req.query.target as string, req.query.path as string);
  res.send("ok");
});
app.post("/file37", (req, res) => {
  fs.linkSync(req.body.src, req.body.dst);
  res.send("ok");
});
app.get("/file38", (req, res) => {
  const fd = fs.openSync(req.query.file as string, "r");
  const buf = Buffer.alloc(100);
  fs.readSync(fd, buf, 0, 100, 0);
  res.send(buf);
});
app.post("/file39", (req, res) => {
  const fd = fs.openSync(req.body.file, "w");
  fs.writeSync(fd, req.body.data);
  res.send("ok");
});
app.get("/file40", (req, res) => {
  fs.accessSync(req.query.path as string);
  res.send("ok");
});

app.get("/sql1", (req, res) => {
  const q = `SELECT * FROM users WHERE id = ${req.query.id}`;
  res.send(q);
});
app.get("/sql2", (req, res) => {
  const q = `SELECT * FROM users WHERE name = '${req.query.name}'`;
  res.send(q);
});
app.get("/sql3", (req, res) => {
  const q = `DELETE FROM users WHERE id = ${req.body.id}`;
  res.send(q);
});
app.post("/sql4", (req, res) => {
  const q = `UPDATE users SET email = '${req.body.email}' WHERE id = ${req.body.id}`;
  res.send(q);
});
app.post("/sql5", (req, res) => {
  const q = `INSERT INTO users (name, email) VALUES ('${req.body.name}', '${req.body.email}')`;
  res.send(q);
});
app.get("/sql6", (req, res) => {
  const q = `SELECT * FROM products WHERE category = '${req.query.cat}'`;
  res.send(q);
});
app.get("/sql7", (req, res) => {
  const q = `SELECT * FROM orders WHERE user_id = ${req.query.uid} AND status = '${req.query.status}'`;
  res.send(q);
});
app.get("/sql8", (req, res) => {
  const q = `SELECT COUNT(*) FROM logs WHERE level = '${req.query.level}'`;
  res.send(q);
});
app.post("/sql9", (req, res) => {
  const q = `DROP TABLE ${req.body.table}`;
  res.send(q);
});
app.get("/sql10", (req, res) => {
  const q = `SELECT * FROM users ORDER BY ${req.query.sort}`;
  res.send(q);
});
app.get("/sql11", (req, res) => {
  const q = `SELECT ${req.query.columns} FROM users`;
  res.send(q);
});
app.get("/sql12", (req, res) => {
  const q = `SELECT * FROM ${req.query.table}`;
  res.send(q);
});
app.get("/sql13", (req, res) => {
  const q = `SELECT * FROM users WHERE role IN (${req.query.roles})`;
  res.send(q);
});
app.post("/sql14", (req, res) => {
  const q = `CREATE TABLE ${req.body.name} (id INT)`;
  res.send(q);
});
app.get("/sql15", (req, res) => {
  const q = `SELECT * FROM users LIMIT ${req.query.limit} OFFSET ${req.query.offset}`;
  res.send(q);
});
app.get("/sql16", (req, res) => {
  const q = `SELECT * FROM users WHERE created_at > '${req.query.date}'`;
  res.send(q);
});
app.post("/sql17", (req, res) => {
  const q = `GRANT ${req.body.perm} ON ${req.body.table} TO ${req.body.user}`;
  res.send(q);
});
app.get("/sql18", (req, res) => {
  const q = `SELECT * FROM users WHERE age BETWEEN ${req.query.min} AND ${req.query.max}`;
  res.send(q);
});
app.get("/sql19", (req, res) => {
  const q = `SELECT * FROM users WHERE email LIKE '%${req.query.search}%'`;
  res.send(q);
});
app.post("/sql20", (req, res) => {
  const q = `ALTER TABLE users ADD COLUMN ${req.body.col} ${req.body.type}`;
  res.send(q);
});

app.post("/mongo1", (req, res) => {
  const query = { $where: req.body.condition };
  res.json(query);
});
app.post("/mongo2", (req, res) => {
  const query = { username: req.body.username, password: req.body.password };
  res.json(query);
});
app.post("/mongo3", (req, res) => {
  const query = { $gt: req.body.value };
  res.json(query);
});
app.post("/mongo4", (req, res) => {
  const query = { role: { $in: req.body.roles } };
  res.json(query);
});
app.post("/mongo5", (req, res) => {
  const query = { $or: req.body.conditions };
  res.json(query);
});
app.post("/mongo6", (req, res) => {
  const query = { email: { $regex: req.body.pattern } };
  res.json(query);
});
app.post("/mongo7", (req, res) => {
  const query = { $text: { $search: req.body.search } };
  res.json(query);
});
app.post("/mongo8", (req, res) => {
  const update = { $set: req.body.fields };
  res.json(update);
});
app.post("/mongo9", (req, res) => {
  const query = eval("(" + req.body.query + ")");
  res.json(query);
});
app.post("/mongo10", (req, res) => {
  const pipeline = JSON.parse(req.body.aggregation);
  res.json(pipeline);
});

app.get("/xss1", (req, res) => {
  res.send(`<h1>Hello ${req.query.name}</h1>`);
});
app.get("/xss2", (req, res) => {
  res.send(`<script>var search = '${req.query.q}';</script>`);
});
app.get("/xss3", (req, res) => {
  res.send(`<div>${req.body.comment}</div>`);
});
app.get("/xss4", (req, res) => {
  res.send(`<input value="${req.query.value}">`);
});
app.get("/xss5", (req, res) => {
  res.send(`<a href="${req.query.url}">Click</a>`);
});
app.get("/xss6", (req, res) => {
  res.send(`<img src="${req.query.img}">`);
});
app.get("/xss7", (req, res) => {
  res.send(`<iframe src="${req.body.frame}"></iframe>`);
});
app.get("/xss8", (req, res) => {
  res.send(`<style>${req.query.css}</style>`);
});
app.get("/xss9", (req, res) => {
  res.send(`<body onload="${req.query.script}">`);
});
app.get("/xss10", (req, res) => {
  res.send(`<div data-value='${req.body.data}'></div>`);
});
app.get("/xss11", (req, res) => {
  res.send(`<!--${req.query.comment}-->`);
});
app.get("/xss12", (req, res) => {
  res.send(`<meta content="${req.query.meta}">`);
});
app.get("/xss13", (req, res) => {
  res.send(`<title>${req.body.title}</title>`);
});
app.get("/xss14", (req, res) => {
  res.send(`<svg>${req.query.svg}</svg>`);
});
app.get("/xss15", (req, res) => {
  res.send(`<object data="${req.body.obj}"></object>`);
});
app.get("/xss16", (req, res) => {
  res.send(`<embed src="${req.query.embed}">`);
});
app.get("/xss17", (req, res) => {
  res.send(`<form action="${req.body.action}"></form>`);
});
app.get("/xss18", (req, res) => {
  res.send(`<button onclick="${req.query.click}">Click</button>`);
});
app.get("/xss19", (req, res) => {
  res.send(`<textarea>${req.body.text}</textarea>`);
});
app.get("/xss20", (req, res) => {
  res.send(`<link href="${req.query.link}">`);
});

app.get("/ssrf1", (req, res) => {
  http.get(req.query.url as string, (r) => r.pipe(res));
});
app.get("/ssrf2", (req, res) => {
  https.get(req.body.endpoint, (r) => r.pipe(res));
});
app.post("/ssrf3", (req, res) => {
  http.request(req.body.url, (r) => r.pipe(res));
});
app.post("/ssrf4", (req, res) => {
  fetch(req.query.api as string)
    .then((r) => r.text())
    .then((d) => res.send(d));
});
app.get("/ssrf5", (req, res) => {
  http.get(`http://${req.query.host}:${req.query.port}`, (r) => r.pipe(res));
});
app.post("/ssrf6", (req, res) => {
  http.get(`http://internal-api/${req.body.path}`, (r) => r.pipe(res));
});
app.get("/ssrf7", (req, res) => {
  http.get(`http://localhost:${req.query.port}`, (r) => r.pipe(res));
});
app.post("/ssrf8", (req, res) => {
  http.get(`http://127.0.0.1/${req.body.endpoint}`, (r) => r.pipe(res));
});
app.get("/ssrf9", (req, res) => {
  http.get(`http://metadata.google.internal/${req.query.path}`, (r) =>
    r.pipe(res),
  );
});
app.post("/ssrf10", (req, res) => {
  http.get(`http://169.254.169.254/${req.body.meta}`, (r) => r.pipe(res));
});
app.get("/ssrf11", (req, res) => {
  http.get(req.query.callback as string, (r) => r.pipe(res));
});
app.post("/ssrf12", (req, res) => {
  http.get(`${req.body.protocol}://${req.body.host}`, (r) => r.pipe(res));
});
app.get("/ssrf13", (req, res) => {
  http.get(`http://admin:${req.query.pass}@internal-api`, (r) => r.pipe(res));
});
app.post("/ssrf14", (req, res) => {
  http.get(`file://${req.body.file}`, (r) => r.pipe(res));
});
app.get("/ssrf15", (req, res) => {
  http.get(`gopher://${req.query.target}`, (r) => r.pipe(res));
});

app.post("/deser1", (req, res) => {
  const obj = eval("(" + req.body.data + ")");
  res.json(obj);
});
app.post("/deser2", (req, res) => {
  const obj = JSON.parse(req.body.json);
  eval(obj.code);
  res.send("ok");
});
app.post("/deser3", (req, res) => {
  const fn = new Function(req.body.func);
  fn();
  res.send("ok");
});
app.post("/deser4", (req, res) => {
  const code = Buffer.from(req.body.b64, "base64").toString();
  eval(code);
  res.send("ok");
});
app.post("/deser5", (req, res) => {
  const obj = JSON.parse(req.body.serialized);
  obj.execute();
  res.send("ok");
});
app.post("/deser6", (req, res) => {
  const vm = require("vm");
  vm.runInThisContext(req.body.code);
  res.send("ok");
});
app.post("/deser7", (req, res) => {
  const script = new (require("vm").Script)(req.body.script);
  script.runInThisContext();
  res.send("ok");
});
app.post("/deser8", (req, res) => {
  eval(Buffer.from(req.body.payload, "hex").toString());
  res.send("ok");
});
app.post("/deser9", (req, res) => {
  Function(req.body.constructor)();
  res.send("ok");
});
app.post("/deser10", (req, res) => {
  setTimeout(req.body.callback, 1000);
  res.send("ok");
});

app.post("/crypto1", (req, res) => {
  const hash = crypto.createHash("md5").update(req.body.data).digest("hex");
  res.send(hash);
});
app.post("/crypto2", (req, res) => {
  const hash = crypto
    .createHash("sha1")
    .update(req.body.password)
    .digest("hex");
  res.send(hash);
});
app.post("/crypto3", (req, res) => {
  const cipher = crypto.createCipher("des", "password");
  res.send("ok");
});
app.post("/crypto4", (req, res) => {
  const cipher = crypto.createCipher("rc4", "key");
  res.send("ok");
});
app.post("/crypto5", (req, res) => {
  const key = "weak";
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  res.send("ok");
});
app.post("/crypto6", (req, res) => {
  const encrypted = crypto
    .createCipher("aes-256-cbc", "password")
    .update(req.body.data, "utf8", "hex");
  res.send(encrypted);
});
app.get("/crypto7", (req, res) => {
  const token = Buffer.from(`${req.query.user}:${Date.now()}`).toString(
    "base64",
  );
  res.send(token);
});
app.post("/crypto8", (req, res) => {
  const random = Math.random().toString();
  res.send(random);
});
app.get("/crypto9", (req, res) => {
  const sessionId = Date.now().toString();
  res.send(sessionId);
});
app.post("/crypto10", (req, res) => {
  const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.alloc(16), null);
  res.send("ok");
});
app.get("/crypto11", (req, res) => {
  const token = crypto
    .createHash("md5")
    .update((req.query.user as string) + "salt")
    .digest("hex");
  res.send(token);
});
app.post("/crypto12", (req, res) => {
  const hmac = crypto
    .createHmac("md5", "secret")
    .update(req.body.data)
    .digest("hex");
  res.send(hmac);
});
app.get("/crypto13", (req, res) => {
  const encrypted = Buffer.from(req.query.data as string).toString("base64");
  res.send(encrypted);
});
app.post("/crypto14", (req, res) => {
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.alloc(32), iv);
  res.send("ok");
});
app.get("/crypto15", (req, res) => {
  const password = req.query.pass;
  res.cookie("auth", password);
  res.send("ok");
});

app.post("/auth1", (req, res) => {
  if (req.body.username === "admin") res.send("Logged in");
});
app.post("/auth2", (req, res) => {
  if (req.body.password.length > 0) res.send("Logged in");
});
app.get("/auth3", (req, res) => {
  if (req.query.token) res.send("Authenticated");
});
app.get("/auth4", (req, res) => {
  if (req.headers.authorization) res.send("Authorized");
});
app.post("/auth5", (req, res) => {
  res.cookie("session", req.body.user, { httpOnly: false, secure: false });
  res.send("ok");
});
app.get("/auth6", (req, res) => {
  const isAdmin = req.query.admin === "true";
  if (isAdmin) res.send("Admin access");
});
app.post("/auth7", (req, res) => {
  if (req.body.role === "admin") res.send("Admin panel");
});
app.get("/auth8", (req, res) => {
  const userId = req.headers["x-user-id"];
  res.send(`User ${userId}`);
});
app.delete("/auth9", (req, res) => {
  res.send("Deleted");
});
app.put("/auth10", (req, res) => {
  res.send("Updated");
});
app.get("/auth11", (req, res) => {
  const secret = process.env.SECRET || "default";
  res.send(secret);
});
app.get("/auth12", (req, res) => {
  res.send({ apiKey: API_KEY });
});
app.post("/auth13", (req, res) => {
  res.setHeader("Set-Cookie", `token=${req.body.token}`);
  res.send("ok");
});
app.get("/auth14", (req, res) => {
  if (req.cookies.admin) res.send("Admin");
});
app.post("/auth15", (req, res) => {
  const jwt = Buffer.from(JSON.stringify({ user: req.body.user })).toString(
    "base64",
  );
  res.send(jwt);
});
app.get("/auth16", (req, res) => {
  if (req.query.id === req.query.userId) res.send("Access granted");
});
app.post("/auth17", (req, res) => {
  if (req.body.password === req.body.confirmPassword) res.send("ok");
});
app.get("/auth18", (req, res) => {
  res.send({ users: ["admin", "user1", "user2"] });
});
app.get("/auth19", (req, res) => {
  res.send({ emails: ["admin@example.com"] });
});
app.get("/auth20", (req, res) => {
  res.send({ sessionSecret: JWT_SECRET });
});

app.get("/redir1", (req, res) => {
  res.redirect(req.query.url as string);
});
app.get("/redir2", (req, res) => {
  res.redirect(301, req.query.next as string);
});
app.post("/redir3", (req, res) => {
  res.redirect(req.body.returnUrl);
});
app.get("/redir4", (req, res) => {
  res.redirect(`http://${req.query.domain}`);
});
app.get("/redir5", (req, res) => {
  res.redirect(req.query.callback as string);
});
app.post("/redir6", (req, res) => {
  res.redirect(req.body.continue);
});
app.get("/redir7", (req, res) => {
  res.redirect(`${req.query.protocol}://${req.query.host}`);
});
app.get("/redir8", (req, res) => {
  res.redirect(req.headers.referer || "/");
});
app.post("/redir9", (req, res) => {
  res.redirect(req.body.redirect_uri);
});
app.get("/redir10", (req, res) => {
  res.location(req.query.to as string);
  res.send();
});

app.post("/regex1", (req, res) => {
  const re = /^(a+)+$/;
  re.test(req.body.input);
  res.send("ok");
});
app.post("/regex2", (req, res) => {
  const re = /^(a|a)*$/;
  re.test(req.body.text);
  res.send("ok");
});
app.post("/regex3", (req, res) => {
  const re = /^(a|ab)*$/;
  re.test(req.body.str);
  res.send("ok");
});
app.post("/regex4", (req, res) => {
  const re = /(a*)*b/;
  re.test(req.body.data);
  res.send("ok");
});
app.post("/regex5", (req, res) => {
  const re = /(x+x+)+y/;
  re.test(req.body.input);
  res.send("ok");
});
app.post("/regex6", (req, res) => {
  const re = /^(([a-z])+.)+[A-Z]([a-z])+$/;
  re.test(req.body.email);
  res.send("ok");
});
app.post("/regex7", (req, res) => {
  const re = /^((a+)+)b$/;
  re.test(req.body.val);
  res.send("ok");
});
app.post("/regex8", (req, res) => {
  const re = /^(a+)+$/;
  const match = req.body.text.match(re);
  res.send("ok");
});
app.post("/regex9", (req, res) => {
  const re = /(.*a){x}/;
  re.test(req.body.input);
  res.send("ok");
});
app.post("/regex10", (req, res) => {
  const re = new RegExp(req.body.pattern);
  re.test(req.body.input);
  res.send("ok");
});

app.get("/misc1", (req, res) => {
  res.send(process.env);
});
app.get("/misc2", (req, res) => {
  res.send({ __dirname, __filename });
});
app.get("/misc3", (req, res) => {
  res.send(require.cache);
});
app.post("/misc4", (req, res) => {
  global[req.body.key] = req.body.value;
  res.send("ok");
});
app.get("/misc5", (req, res) => {
  delete require.cache[req.query.module as string];
  res.send("ok");
});
app.post("/misc6", (req, res) => {
  process.env[req.body.key] = req.body.value;
  res.send("ok");
});
app.get("/misc7", (req, res) => {
  res.send({ version: process.version, platform: process.platform });
});
app.post("/misc8", (req, res) => {
  require(req.body.module);
  res.send("ok");
});
app.get("/misc9", (req, res) => {
  const Module = require("module");
  const m = new Module();
  res.send("ok");
});
app.post("/misc10", (req, res) => {
  process.chdir(req.body.dir);
  res.send("ok");
});
app.get("/misc11", (req, res) => {
  res.send(process.argv);
});
app.get("/misc12", (req, res) => {
  res.send(process.execPath);
});
app.post("/misc13", (req, res) => {
  process.exit(parseInt(req.body.code));
});
app.get("/misc14", (req, res) => {
  const mem = process.memoryUsage();
  res.json(mem);
});
app.get("/misc15", (req, res) => {
  res.send({ cwd: process.cwd(), uptime: process.uptime() });
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});
