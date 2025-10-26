// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical path traversal vulnerabilities for testing Aikido scanner

import java.io.*;
import javax.servlet.http.*;

public class VulnerablePath extends HttpServlet {
    
    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        String filename = request.getParameter("file");
        
        try {
            // VULNERABLE: Direct file access
            File file = new File("/var/data/" + filename);
            FileInputStream fis = new FileInputStream(file);
            
            // VULNERABLE: Path concatenation
            String path = request.getParameter("path");
            BufferedReader reader = new BufferedReader(
                new FileReader(path)
            );
            
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
