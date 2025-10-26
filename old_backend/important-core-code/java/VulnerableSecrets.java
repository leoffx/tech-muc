// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains exposed secrets for testing Aikido scanner

import java.sql.*;

public class VulnerableSecrets {
    
    // VULNERABLE: Hardcoded credentials
    private static final String DB_PASSWORD = "MySecretP@ssw0rd123";
    private static final String API_KEY = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr";
    private static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
    private static final String AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    
    public Connection getConnection() throws SQLException {
        // VULNERABLE: Password in connection string
        return DriverManager.getConnection(
            "jdbc:postgresql://db.example.com:5432/production",
            "admin",
            "SuperSecretPassword123!"
        );
    }
    
    private String jwtSecret = "my-jwt-secret-key-12345";
    private String encryptionKey = "AES256EncryptionKey12345678";
}
