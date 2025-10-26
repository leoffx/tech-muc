// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains exposed secrets for testing Aikido scanner

package main

import "database/sql"

// VULNERABLE: Hardcoded credentials
const (
    DBPassword = "MySecretP@ssw0rd123"
    APIKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr"
    AWSAccessKey = "AKIAIOSFODNN7EXAMPLE"
    AWSSecretKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
)

func connectDB() (*sql.DB, error) {
    // VULNERABLE: Password in connection string
    return sql.Open("postgres", 
        "host=db.example.com user=admin password=SuperSecret123! dbname=production")
}

var jwtSecret = "my-jwt-secret-key-12345"

func main() {
    connectDB()
}
