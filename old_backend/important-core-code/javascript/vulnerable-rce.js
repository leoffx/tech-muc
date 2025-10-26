// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical RCE vulnerabilities for testing Aikido scanner

const express = require('express');
const app = express();

app.get('/calculate', (req, res) => {
  const expression = req.query.expr;
  // VULNERABLE: eval() executes arbitrary code
  const result = eval(expression);
  res.json({ result: result });
});

app.post('/process', (req, res) => {
  const code = req.body.code;
  // VULNERABLE: Function constructor = eval
  const fn = new Function('return ' + code);
  res.json({ output: fn() });
});

// VULNERABLE: vm module without proper sandboxing
const vm = require('vm');
app.get('/vm-exec', (req, res) => {
  const script = req.query.script;
  const result = vm.runInThisContext(script);
  res.json({ result });
});

app.listen(3000);
