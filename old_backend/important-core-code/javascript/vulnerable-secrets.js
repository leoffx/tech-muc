// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains exposed secrets for testing Aikido scanner

const express = require('express');
const app = express();

// VULNERABLE: Hardcoded credentials
const DB_PASSWORD = 'MyS3cr3tP@ssw0rd!';
const API_KEY = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr';
const AWS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const STRIPE_KEY = 'sk_live_51234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP';

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'db.example.com',
  user: 'admin',
  password: 'SuperSecretPassword123!',
  database: 'production'
});

// VULNERABLE: Private key in code
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN
OPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQR
-----END RSA PRIVATE KEY-----`;

const JWT_SECRET = 'my-super-secret-jwt-key-12345';

app.listen(3000);
