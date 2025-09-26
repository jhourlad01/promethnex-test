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
define('DB_NAME', $_ENV['DB_NAME'] ?? 'product_catalog');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? '');

// API Configuration
define('API_BASE_URL', $_ENV['API_BASE_URL'] ?? 'http://localhost:8000/api');
define('GRAPHQL_ENDPOINT', $_ENV['GRAPHQL_ENDPOINT'] ?? 'http://localhost:8000/graphql');

// Application Settings
define('APP_NAME', $_ENV['APP_NAME'] ?? 'Product Catalog');
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');
define('APP_DEBUG', $_ENV['APP_DEBUG'] ?? 'true');

// Server Configuration
define('SERVER_HOST', $_ENV['SERVER_HOST'] ?? 'localhost');
define('SERVER_PORT', $_ENV['SERVER_PORT'] ?? '8000');

// Security
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'default-secret-key');
define('SESSION_SECRET', $_ENV['SESSION_SECRET'] ?? 'default-session-secret');

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
