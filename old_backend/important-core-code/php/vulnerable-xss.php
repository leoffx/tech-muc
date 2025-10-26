<?php
// INTENTIONALLY VULNERABLE CODE - FOR SECURITY SCANNER TESTING ONLY
// This file contains XSS vulnerabilities for testing Aikido scanner

// VULNERABLE: Reflected XSS
$name = $_GET['name'];
echo "<h1>Welcome " . $name . "</h1>";

// VULNERABLE: Stored XSS (from database)
$comment = $_POST['comment'];
// Assume this is stored then displayed:
echo "<div class='comment'>" . $comment . "</div>";

// VULNERABLE: DOM-based XSS
$search_query = $_GET['q'];
?>
<script>
  var query = "<?php echo $search_query; ?>";
  document.write("<h2>Results for: " + query + "</h2>");
</script>
