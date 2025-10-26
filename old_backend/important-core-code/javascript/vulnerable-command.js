// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical command injection vulnerabilities for testing Aikido scanner

const express = require('express');
const { exec, execSync } = require('child_process');
const app = express();

app.get('/ping', (req, res) => {
  const host = req.query.host;
  // VULNERABLE: Unsanitized input in shell command
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(stdout);
  });
});

app.get('/convert', (req, res) => {
  const filename = req.query.file;
  // VULNERABLE: Command injection via filename
  const output = execSync(`convert ${filename} output.png`);
  res.send('Converted');
});

const spawn = require('child_process').spawn;
app.get('/list', (req, res) => {
  const dir = req.query.directory;
  // VULNERABLE: Even spawn with shell:true is dangerous
  const ls = spawn('ls', [dir], { shell: true });
  ls.stdout.on('data', (data) => res.write(data));
});

app.listen(3000);
