# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical path traversal vulnerabilities for testing Aikido scanner

from flask import Flask, request, send_file
import os

app = Flask(__name__)

@app.route('/download')
def download():
    filename = request.args.get('file')
    # VULNERABLE: No path validation
    return send_file(f'/var/data/{filename}')

@app.route('/read')
def read_file():
    path = request.args.get('path')
    # VULNERABLE: Direct file access
    with open(path, 'r') as f:
        return f.read()

@app.route('/static')
def serve_static():
    resource = request.args.get('resource')
    # VULNERABLE: os.path.join doesn't prevent traversal
    filepath = os.path.join('/app/static', resource)
    return send_file(filepath)

if __name__ == '__main__':
    app.run()
