// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical SQL injection vulnerabilities for testing Aikido scanner

const express = require('express');
const mysql = require('mysql');
const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'userdb'
});

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // VULNERABLE: String concatenation allows SQL injection
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  connection.query(query, (error, results) => {
    res.json(results);
  });
});

app.get('/search', (req, res) => {
  const searchTerm = req.query.term;
  // VULNERABLE: Template literals still vulnerable
  const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
  connection.query(query, (error, results) => {
    res.json(results);
  });
});

app.listen(3000);
