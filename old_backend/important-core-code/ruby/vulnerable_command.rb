# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical command injection vulnerabilities for testing Aikido scanner

class SystemController < ApplicationController
  def ping
    host = params[:host]
    
    # VULNERABLE: Backticks with user input
    output = `ping -c 4 #{host}`
    render plain: output
  end
  
  def process
    filename = params[:file]
    
    # VULNERABLE: system() with interpolation
    system("convert #{filename} output.png")
  end
  
  def execute
    command = params[:cmd]
    
    # VULNERABLE: exec with user input
    exec("ls -la #{command}")
  end
end
