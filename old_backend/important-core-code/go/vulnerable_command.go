// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical command injection vulnerabilities for testing Aikido scanner

package main

import (
    "net/http"
    "os/exec"
)

func pingHandler(w http.ResponseWriter, r *http.Request) {
    host := r.URL.Query().Get("host")
    
    // VULNERABLE: Command injection via exec.Command with shell
    cmd := exec.Command("sh", "-c", "ping -c 4 "+host)
    output, _ := cmd.Output()
    w.Write(output)
}

func processHandler(w http.ResponseWriter, r *http.Request) {
    filename := r.URL.Query().Get("file")
    
    // VULNERABLE: Unsanitized input in command
    cmd := exec.Command("convert", filename, "output.png")
    cmd.Run()
}

func main() {
    http.HandleFunc("/ping", pingHandler)
    http.HandleFunc("/process", processHandler)
    http.ListenAndServe(":8080", nil)
}
