<?php
// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical SQL injection vulnerabilities for testing Aikido scanner

$servername = "localhost";
$username = "root";
$password = "password123";
$conn = new mysqli($servername, $username, $password, "database");

// VULNERABLE: Direct string concatenation
$user_id = $_GET['id'];
$sql = "SELECT * FROM users WHERE id = '" . $user_id . "'";
$result = $conn->query($sql);

// VULNERABLE: String interpolation
$search = $_POST['search'];
$query = "SELECT * FROM products WHERE name LIKE '%$search%'";
$result = mysqli_query($conn, $query);

// VULNERABLE: Even with double quotes
$email = $_REQUEST['email'];
$sql = "SELECT * FROM users WHERE email = \"$email\"";
?>
