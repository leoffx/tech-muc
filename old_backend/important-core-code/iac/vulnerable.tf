# INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
# This file contains IaC misconfigurations for testing Aikido scanner

# VULNERABLE: S3 bucket publicly accessible
resource "aws_s3_bucket" "data" {
  bucket = "my-sensitive-data"
  acl    = "public-read"
}

# VULNERABLE: Security group allows all traffic
resource "aws_security_group" "allow_all" {
  name = "allow_all"
  
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# VULNERABLE: Unencrypted RDS instance
resource "aws_db_instance" "database" {
  engine         = "mysql"
  instance_class = "db.t3.micro"
  storage_encrypted = false
}

# VULNERABLE: Hardcoded credentials
resource "aws_instance" "web" {
  ami = "ami-12345"
  user_data = <<-EOF
    #!/bin/bash
    export DB_PASSWORD="SuperSecret123!"
    export API_KEY="sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr"
  EOF
}
