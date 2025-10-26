// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical command injection vulnerabilities for testing Aikido scanner

import java.io.*;

public class VulnerableCommand {
    
    public void pingHost(String host) throws IOException {
        // VULNERABLE: Runtime.exec with concatenation
        Runtime rt = Runtime.getRuntime();
        Process proc = rt.exec("ping -c 4 " + host);
    }
    
    public void processFile(String filename) throws IOException {
        // VULNERABLE: ProcessBuilder with user input
        ProcessBuilder pb = new ProcessBuilder("convert", filename, "output.png");
        pb.start();
    }
    
    public void executeCommand(String cmd) throws IOException {
        // VULNERABLE: Shell command execution
        String[] command = {"/bin/sh", "-c", cmd};
        Runtime.getRuntime().exec(command);
    }
}
