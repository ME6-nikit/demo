# OMA Backend (Node.js + Express)

Node.js backend service for the Order Management Automation system.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The server starts on `http://localhost:3000` and auto-runs database migrations.

## Prerequisites

- Node.js >= 18.0.0
- MySQL 8.0 running on `localhost:3306`

Start MySQL using the root-level Docker Compose:

```bash
# from project root
docker-compose up -d
```

## API Endpoints

See the root [README](../README.md) for the full API reference.

### Quick Test

```bash
curl -X POST http://localhost:3000/api/shopify/order-webhook \
  -H "Content-Type: application/json" \
  -d '{"id":5678901234,"order_number":1042,"name":"#1042","customer":{"first_name":"John","last_name":"Doe"},"shipping_lines":[{"title":"Standard Delivery"}],"line_items":[{"title":"Chocolate Cake","quantity":1,"price":"45.00"}],"note_attributes":[{"name":"delivery_date","value":"2026-03-30"},{"name":"delivery_time","value":"2-4 PM"}],"tags":""}'
```

## Architecture

```
backend/
├── src/
│   ├── app.js                  # Express app + middleware
│   ├── server.js               # Bootstrap + DB wait
│   ├── config/env.js           # Environment parsing
│   ├── constants/              # Departments, statuses, enums
│   ├── controllers/            # HTTP request handlers
│   ├── db/                     # Pool, migrations, SQL
│   ├── middleware/              # Error + 404 handlers
│   ├── repositories/           # Data access layer
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic
│   └── utils/                  # Helpers + mappers
├── .env.example
└── package.json
```
