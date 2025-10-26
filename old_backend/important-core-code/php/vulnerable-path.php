<?php
// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains critical path traversal vulnerabilities for testing Aikido scanner

// VULNERABLE: Direct file inclusion
$page = $_GET['page'];
include("/var/www/pages/" . $page);

// VULNERABLE: File reading
$filename = $_GET['file'];
$content = file_get_contents($filename);
echo $content;

// VULNERABLE: readfile with user input
$document = $_REQUEST['doc'];
readfile("/documents/" . $document);

// VULNERABLE: require with concatenation
$module = $_GET['module'];
require($module . '.php');
?>
