// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical SQL injection vulnerabilities for testing Aikido scanner

import java.sql.*;
import javax.servlet.http.*;

public class VulnerableSQL extends HttpServlet {
    
    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        String userId = request.getParameter("id");
        
        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost/db", "root", "password123"
            );
            Statement stmt = conn.createStatement();
            
            // VULNERABLE: String concatenation
            String query = "SELECT * FROM users WHERE id = '" + userId + "'";
            ResultSet rs = stmt.executeQuery(query);
            
            // VULNERABLE: String format
            String search = request.getParameter("search");
            String query2 = String.format("SELECT * FROM products WHERE name LIKE '%%%s%%'", search);
            rs = stmt.executeQuery(query2);
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
