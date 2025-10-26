// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical SQL injection vulnerabilities for testing Aikido scanner

package main

import (
    "database/sql"
    "fmt"
    "net/http"
    _ "github.com/lib/pq"
)

func getUserHandler(w http.ResponseWriter, r *http.Request) {
    userId := r.URL.Query().Get("id")
    
    db, _ := sql.Open("postgres", "user=admin password=secret123 dbname=mydb")
    defer db.Close()
    
    // VULNERABLE: String concatenation in query
    query := "SELECT * FROM users WHERE id = '" + userId + "'"
    rows, _ := db.Query(query)
    defer rows.Close()
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
    search := r.URL.Query().Get("term")
    
    db, _ := sql.Open("mysql", "root:password@/database")
    
    // VULNERABLE: fmt.Sprintf in SQL
    query := fmt.Sprintf("SELECT * FROM products WHERE name LIKE '%%%s%%'", search)
    db.Query(query)
}

func main() {
    http.HandleFunc("/user", getUserHandler)
    http.HandleFunc("/search", searchHandler)
    http.ListenAndServe(":8080", nil)
}
