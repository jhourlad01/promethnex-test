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
- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Backend:** PHP
- **Database:** MySQL
- **API:** REST + GraphQL
- **Code Quality:** ESLint, PHP CodeSniffer, Prettier
- **AI Analysis:** ONNX Runtime + Transformers.js
- **Visual Testing:** Playwright + AI Image Analysis

## AI Visual Analysis

This project includes an advanced visual analysis system that automatically captures screenshots across multiple viewports and uses AI to analyze the UI.

### Features
- **Multi-viewport Screenshots**: Mobile, tablet, desktop, and large desktop
- **AI-Powered Analysis**: Automated image captioning and UI analysis
- **Interactive Reports**: HTML reports with viewport comparison
- **Model Fallback System**: Automatic fallback to working models
- **Offline Capable**: Models cached locally for offline analysis

### Model Usage
This project uses ONNX-based models from Hugging Face Model Hub:
- **Primary Model**: `Xenova/vit-gpt2-image-captioning` (fast, reliable)
- **Fallback Models**: Multiple BLIP and ViT models for reliability
- **License**: BSD-3-Clause for verified models, others require verification
- **No API Keys**: Completely local inference using ONNX Runtime

### Model Configuration
Configure model behavior and retry logic:

```bash
# Delay between analysis calls (milliseconds)
set API_DELAY_MS=1000

# Maximum retry attempts for failed requests
set MAX_RETRIES=2

# Model to use for analysis
set TRANSFORMERS_MODEL=Xenova/vit-gpt2-image-captioning
```

### Supported Models
The following ONNX models are used for visual analysis:

**Primary Models:**
- `Xenova/vit-gpt2-image-captioning` (Primary - fast and reliable)
- `Xenova/blip-image-captioning-base` (Fallback - good accuracy)

**Alternative Models:**
- `nlpconnect/vit-gpt2-image-captioning` (Alternative ViT model)
- `Salesforce/blip-image-captioning-base` (BSD-3-Clause - verified free)

### Model Download Process
1. **First Run**: Models download from Hugging Face (2-4GB total)
2. **ONNX Runtime**: Models converted to ONNX format for optimal performance
3. **Local Caching**: Models stored in system cache (`~/.cache/huggingface/hub/` on Unix, `%USERPROFILE%\.cache\huggingface\hub` on Windows)
4. **Subsequent Runs**: Load from local cache (completely offline capable)

**Note:** Models use ONNX Runtime for fast, local inference. No external API calls or authentication required.

## Visual Analysis Workflow

### 1. Test Model Setup
```bash
npm run test-models
```
This command:
- Tests model download and initialization
- Verifies ONNX Runtime compatibility
- Pre-downloads models for faster analysis
- Provides troubleshooting information

### 2. Simple Screenshot Analysis
```bash
npm run analyze-simple
```
This command:
- Captures screenshots across all viewports
- Generates basic reports without AI analysis
- Useful for visual regression testing
- Faster execution (no AI processing)

### 3. Full AI Analysis
```bash
npm run analyze
```
This command:
- Captures screenshots across all viewports
- Analyzes each screenshot with AI
- Generates detailed HTML reports
- Identifies UI issues and improvements
- Creates interactive viewport comparisons

### Analysis Output
- **Screenshots**: Stored in `scripts/playwright/screenshots/`
- **HTML Report**: `analysis-report.html` (interactive)
- **JSON Data**: `analysis-report.json` (structured data)
- **Metadata**: Viewport info, timestamps, file sizes

### Supported Pages
- **Home Page**: Main product catalog view
- **Add Product Modal**: Modal dialog for adding products
- **Responsive Design**: Analysis across mobile, tablet, desktop, large desktop
