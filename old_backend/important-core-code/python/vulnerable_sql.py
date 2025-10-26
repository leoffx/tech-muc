# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical SQL injection vulnerabilities for testing Aikido scanner

import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # VULNERABLE: String formatting in SQL
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    # VULNERABLE: String concatenation
    query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
    cursor.execute(query)
    return cursor.fetchone()

if __name__ == '__main__':
    app.run()
