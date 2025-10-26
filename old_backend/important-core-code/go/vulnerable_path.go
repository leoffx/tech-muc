// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical path traversal vulnerabilities for testing Aikido scanner

package main

import (
    "io/ioutil"
    "net/http"
)

func downloadHandler(w http.ResponseWriter, r *http.Request) {
    filename := r.URL.Query().Get("file")
    
    // VULNERABLE: No path validation
    content, _ := ioutil.ReadFile("/var/data/" + filename)
    w.Write(content)
}

func serveHandler(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Query().Get("path")
    
    // VULNERABLE: Direct file serving
    http.ServeFile(w, r, path)
}

func main() {
    http.HandleFunc("/download", downloadHandler)
    http.HandleFunc("/serve", serveHandler)
    http.ListenAndServe(":8080", nil)
}
