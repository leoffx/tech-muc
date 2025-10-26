// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical path traversal vulnerabilities for testing Aikido scanner

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.get('/download', (req, res) => {
  const filename = req.query.file;
  // VULNERABLE: Direct path traversal
  res.sendFile(filename);
});

app.get('/read', (req, res) => {
  const file = req.query.path;
  // VULNERABLE: No sanitization
  const content = fs.readFileSync('/var/data/' + file, 'utf8');
  res.send(content);
});

app.get('/static', (req, res) => {
  const resource = req.query.resource;
  // VULNERABLE: path.join doesn't prevent traversal
  const filePath = path.join(__dirname, 'public', resource);
  res.sendFile(filePath);
});

app.listen(3000);
