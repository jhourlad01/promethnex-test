#!/bin/bash
echo "Starting Product Catalog with Hot Reloading..."
echo

echo "1. Compiling SCSS..."
npx sass assets/scss/styles.scss assets/css/style.css --style=expanded
if [ $? -ne 0 ]; then
    echo "ERROR: SCSS compilation failed!"
    exit 1
fi
echo "SCSS compilation completed successfully!"
echo

echo "2. Running code quality checks..."
npm run prestart
if [ $? -ne 0 ]; then
    echo "ERROR: Code quality checks failed!"
    echo "Fix the issues above before starting the server."
    exit 1
fi
echo

echo "3. Starting development server with hot reloading..."
echo
echo "Open: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo

npm run start
