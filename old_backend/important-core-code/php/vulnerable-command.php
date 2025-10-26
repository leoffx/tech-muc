<?php
// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical command injection vulnerabilities for testing Aikido scanner

// VULNERABLE: shell_exec with user input
$host = $_GET['host'];
$output = shell_exec("ping -c 4 " . $host);
echo $output;

// VULNERABLE: system() function
$filename = $_POST['file'];
system("cat /var/log/" . $filename);

// VULNERABLE: exec() with concatenation
$dir = $_GET['directory'];
exec("ls -la " . $dir, $output);
print_r($output);

// VULNERABLE: backtick operator
$command = $_GET['cmd'];
$result = `$command`;
echo $result;
?>
