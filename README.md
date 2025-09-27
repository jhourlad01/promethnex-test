# Product Catalog Frontend

A modern product catalog web application with AI-powered visual analysis capabilities.

## Quick Start

```bash
# Windows
start.bat

# Linux/Mac  
./start.sh
```

**Server starts at `http://localhost:8001` with hot reloading**

## Setup

1. **Environment:**
```bash
cp env.example .env
# Edit .env with your database settings
```

2. **Database:**
```bash
npm run seed
# Creates products table and inserts sample data
```

## Project Structure

```
├── api/                    # API endpoints
│   ├── products.php       # REST API for products
│   ├── add-product.php    # Add product endpoint
│   └── graphql.php        # GraphQL endpoint
├── assets/                # Frontend assets
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── images/           # Product images
│   └── scss/             # SCSS source files
├── scripts/              # Automation scripts
│   └── playwright/       # Visual analysis system
├── models/               # PHP data models
├── config/               # Configuration files
├── db/                   # Database files
├── index.php             # Main entry point
└── package.json          # Node.js dependencies
```

## API Endpoints

### REST API

#### GET /api/products
Returns a JSON list of products (id, name, price).

**Response:**
```json
[
  {
    "id": 1,
    "name": "iPhone 15 Pro",
    "price": 999.00
  }
]
```

#### POST /api/products
Accepts JSON input (name, price) and adds it to the list.

**Request:**
```json
{
  "name": "New Product",
  "price": 99.99
}
```

**Response:**
```json
{
  "id": 21,
  "name": "New Product",
  "price": 99.99
}
```

### GraphQL API (Bonus)

#### POST /api/graphql
GraphQL endpoint for fetching products.

**Request:**
```json
{
  "query": "{ products { id name price image } }"
}
```

**Response:**
```json
{
  "data": {
    "products": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "price": 999.00,
        "image": "iphone-15-pro.jpg"
      }
    ]
  }
}
```

## Database Schema

```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Commands

```bash
npm run start      # Start development server
npm run seed       # Seed database
npm run lint       # Lint code
npm run analyze    # Visual analysis with AI
```

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Backend:** PHP
- **Database:** MySQL
- **API:** REST + GraphQL
- **Code Quality:** ESLint, PHP CodeSniffer, Prettier
- **AI Analysis:** ONNX Runtime + Transformers.js
- **Visual Testing:** Playwright + AI Image Analysis

## AI Visual Analysis

Uses ONNX Runtime + Transformers.js for local AI analysis.

## Visual Analysis

```bash
npm run analyze
```
