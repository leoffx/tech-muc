# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical path traversal vulnerabilities for testing Aikido scanner

class FilesController < ApplicationController
  def download
    filename = params[:file]
    
    # VULNERABLE: Direct file sending
    send_file "/var/data/#{filename}"
  end
  
  def read
    path = params[:path]
    
    # VULNERABLE: No path validation
    content = File.read(path)
    render plain: content
  end
end
