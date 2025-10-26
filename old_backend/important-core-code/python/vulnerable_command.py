# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical command injection vulnerabilities for testing Aikido scanner

import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/ping')
def ping():
    host = request.args.get('host')
    # VULNERABLE: Shell injection
    result = os.system(f'ping -c 4 {host}')
    return str(result)

@app.route('/backup')
def backup():
    filename = request.args.get('file')
    # VULNERABLE: Command injection via subprocess
    subprocess.call(f'tar -czf backup.tar.gz {filename}', shell=True)
    return 'Backup created'

@app.route('/convert')
def convert():
    input_file = request.args.get('input')
    # VULNERABLE: os.popen allows injection
    result = os.popen(f'convert {input_file} output.png').read()
    return result

if __name__ == '__main__':
    app.run()
