<?php

/**
 * Configuration file with environment variable support
 */

// Load environment variables from .env file
function loadEnv($path)
{
    if (! file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

// Load .env file if it exists
loadEnv(__DIR__ . '/.env');

// Database Configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'promethex');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? '');

// Application Settings
define('APP_NAME', $_ENV['APP_NAME'] ?? 'Promethex Store');
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');
define('APP_DEBUG', $_ENV['APP_DEBUG'] ?? 'true');

// Server Configuration
define('SERVER_HOST', $_ENV['SERVER_HOST'] ?? 'localhost');
define('SERVER_PORT', $_ENV['SERVER_PORT'] ?? '8001');

// Helper function to get environment variable
function env($key, $default = null)
{
    return $_ENV[$key] ?? $default;
}

// Helper function to check if in development mode
function isDevelopment()
{
    return env('APP_ENV') === 'development';
}

// Helper function to check if debug is enabled
function isDebugEnabled()
{
    return env('APP_DEBUG') === 'true';
}

// Database Connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    if (isDebugEnabled()) {
        die("Database connection failed: " . $e->getMessage());
    } else {
        die("Database connection failed. Please check your configuration.");
    }
}
