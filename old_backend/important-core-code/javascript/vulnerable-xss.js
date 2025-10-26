// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains XSS vulnerabilities for testing Aikido scanner

const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const query = req.query.q;
  // VULNERABLE: Reflected XSS
  res.send(`<h1>Search results for: ${query}</h1>`);
});

app.get('/comment', (req, res) => {
  const comment = req.query.comment;
  // VULNERABLE: DOM-based XSS
  res.send(`
    <script>
      document.getElementById('output').innerHTML = '${comment}';
    </script>
  `);
});

app.listen(3000);
