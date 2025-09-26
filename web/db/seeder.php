<?php
require_once __DIR__ . '/../config.php';

// Create database connection
$dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$sql = file_get_contents(__DIR__ . '/seed.sql');
$statements = explode(';', $sql);

foreach ($statements as $statement) {
    $statement = trim($statement);
    if ($statement) {
        $pdo->exec($statement);
    }
}

echo "✅ Database seeded!\n";
