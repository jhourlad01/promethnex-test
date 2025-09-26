@echo off
echo Starting Product Catalog with Hot Reloading...
echo.

echo 1. Compiling SCSS...
call npx sass assets/scss/styles.scss assets/css/style.css --style=expanded
if %errorlevel% neq 0 (
    echo ERROR: SCSS compilation failed!
    pause
    exit /b 1
)
echo SCSS compilation completed successfully!
echo.

echo 2. Starting development server with hot reloading...
echo.
echo Open: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

call npm run start
