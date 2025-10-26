# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains critical SQL injection vulnerabilities for testing Aikido scanner

class UsersController < ApplicationController
  def show
    user_id = params[:id]
    
    # VULNERABLE: String interpolation in SQL
    @user = User.where("id = '#{user_id}'").first
    
    # VULNERABLE: String concatenation
    search = params[:search]
    @results = Product.where("name LIKE '%" + search + "%'")
  end
  
  def find
    email = params[:email]
    # VULNERABLE: Even with double quotes
    @user = User.find_by_sql("SELECT * FROM users WHERE email = \"#{email}\"")
  end
end
