<?php
// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains exposed secrets for testing Aikido scanner

// VULNERABLE: Hardcoded credentials
$db_password = "MySecretP@ssw0rd123";
$api_key = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr";

// VULNERABLE: Database connection
$conn = new mysqli(
    "db.example.com",
    "admin",
    "SuperSecretPassword123!",
    "production_db"
);

// VULNERABLE: API credentials
define('AWS_KEY', 'AKIAIOSFODNN7EXAMPLE');
define('AWS_SECRET', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
define('STRIPE_SECRET', 'sk_live_51234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP');

$jwt_secret = "my-jwt-secret-key-12345";
?>
