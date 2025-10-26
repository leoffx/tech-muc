# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains exposed secrets for testing Aikido scanner

from flask import Flask
import psycopg2

app = Flask(__name__)

# VULNERABLE: Hardcoded secrets
DATABASE_PASSWORD = "MySecretDBPassword123!"
API_KEY = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr"
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# VULNERABLE: Connection string with password
conn = psycopg2.connect(
    host="db.example.com",
    database="production",
    user="admin",
    password="SuperSecret123!"
)

# VULNERABLE: JWT secret in code
JWT_SECRET = "my-secret-key-12345"
ENCRYPTION_KEY = b'Sixteen byte key'

if __name__ == '__main__':
    app.run()
