# Product Catalog

Coding Assessment (Skills Test): Simple E-Commerce Site in PHP and GraphQL for Promethnex

## Development Setup

### Quick Start
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

**The server will:**
1. Compile SCSS
2. Run code quality checks (linting)
3. **Stop if any checks fail** - fix issues before starting
4. Start the server with hot reloading

Opens your app at `http://localhost:8000` with hot reloading enabled.


## Environment Setup

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Edit `.env` with your configuration:
- Database settings
- API endpoints
- Security keys

## Development Commands

### Linting & Formatting
```bash
# Lint JavaScript and PHP
npm run lint

# Format JavaScript with Prettier
npm run format:js

# Fix PHP code style
npm run lint:php

# Format everything
npm run format
```

## Tech Stack
- Frontend: HTML5, Bootstrap 5, jQuery, SCSS
- Backend: PHP
- Build Tools: Sass, BrowserSync, npm scripts
- Environment: dotenv support
- Code Quality: ESLint, Prettier, PHP CS Fixer
