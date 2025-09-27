# Product Catalog API

Coding Assessment: Simple Product Catalog API in PHP

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
# Start development server
npm run start

# Seed database
npm run seed

# Lint code
npm run lint

# Visual analysis with AI (generates screenshots + analyzes)
npm run analyze

# Simple analysis without AI (screenshots only)
npm run analyze-simple

# Test model download (FREE models only)
npm run test-models
```

## Tech Stack
- **Backend:** PHP
- **Database:** MySQL
- **API:** REST + GraphQL
- **Code Quality:** ESLint, PHP CodeSniffer
- **AI Analysis:** Hugging Face Vision Models
- **Visual Testing:** Playwright + Hugging Face Vision

## AI Analysis Configuration

### Model Usage
This project uses models from Hugging Face Model Hub:
- **blip-image-captioning-base**: BSD-3-Clause license (verified free)
- **Xenova models**: License not specified in API (verify before commercial use)
- No API keys required
- No authentication needed

### Model Configuration
Configure model behavior and retry logic:

```bash
# Delay between API calls (milliseconds)
set API_DELAY_MS=2000

# Maximum retry attempts for failed requests
set MAX_RETRIES=3

# Model to use for analysis
set TRANSFORMERS_MODEL=blip-image-captioning-base
```

### Supported Models
The following models are used for visual analysis:

**Image Captioning Models:**
- `blip-image-captioning-base` (BSD-3-Clause - verified free)
- `Salesforce/blip-image-captioning-base` (BSD-3-Clause - verified free)
- `Xenova/vit-gpt2-image-captioning` (License not specified - verify before use)
- `Xenova/blip-image-captioning-base` (License not specified - verify before use)

### Model Download Process
1. **First Run**: Models download from Hugging Face (2-4GB total)
2. **Caching**: Models stored locally in `~/.cache/huggingface/hub/`
3. **Subsequent Runs**: Load from local cache (offline capable)

**Note:** Some models have verified free licenses, others require verification. No API keys, subscriptions, or payments required for basic usage.
