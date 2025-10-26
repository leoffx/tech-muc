# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical code injection vulnerabilities for testing Aikido scanner

from flask import Flask, request

app = Flask(__name__)

@app.route('/calc')
def calculate():
    expr = request.args.get('expression')
    # VULNERABLE: eval() executes arbitrary code
    result = eval(expr)
    return str(result)

@app.route('/exec')
def execute():
    code = request.form.get('code')
    # VULNERABLE: exec() runs arbitrary Python
    exec(code)
    return 'Executed'

@app.route('/compile')
def compile_code():
    source = request.args.get('source')
    # VULNERABLE: compile + eval = RCE
    compiled = compile(source, '<string>', 'eval')
    return str(eval(compiled))

if __name__ == '__main__':
    app.run()
