# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains exposed secrets for testing Aikido scanner

class Application < Rails::Application
  # VULNERABLE: Hardcoded secrets
  config.database_password = "MySecretP@ssw0rd123"
  config.api_key = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr"
  
  DB_CONFIG = {
    host: "db.example.com",
    username: "admin",
    password: "SuperSecretPassword123!",
    database: "production"
  }
  
  AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
  AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  
  JWT_SECRET = "my-jwt-secret-key-12345"
end
