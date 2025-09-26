#!/bin/bash
echo "Starting Product Catalog with Hot Reloading..."
echo
echo "1. Compiling SCSS..."
npx sass assets/scss/styles.scss assets/css/style.css --style=expanded
echo "SCSS compilation completed successfully!"
echo
echo "2. Starting development server with hot reloading..."
echo
echo "Open: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo

npm run start
