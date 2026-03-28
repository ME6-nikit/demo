# Order Management Automation (OMA)

A full-stack system for automating Shopify order processing, department-wise PDF generation, printer management, and print job dispatch.

## Project Structure

```
oma/
├── backend/          # Node.js + Express API server (MySQL 8.0)
├── frontend/         # React 17 web dashboard
├── electron/         # Electron desktop app for printer management
├── docker-compose.yml
└── README.md
```

| Component | Tech | Purpose |
|-----------|------|---------|
| **backend/** | Node 18.16.1, Express 4, MySQL 8.0 | Shopify webhooks, order storage, rule engine, PDF generation, print jobs |
| **frontend/** | React 17 | Order dashboard, status tracking, printer assignment UI |
| **electron/** | Electron (latest) | Printer detection, sync, automated print job polling and dispatch |

## Quick Start (Local Development)

### 1. Start MySQL

```bash
docker-compose up -d
```

Or install MySQL 8.0 locally and create the `oma` database:

```sql
CREATE DATABASE IF NOT EXISTS oma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The server starts at `http://localhost:3000`, auto-runs migrations, and is ready to accept webhooks.

### 3. Test with a Sample Webhook

```bash
curl -X POST http://localhost:3000/api/shopify/order-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": 5678901234,
    "order_number": 1042,
    "name": "#1042",
    "email": "john.doe@example.com",
    "created_at": "2026-03-28T10:30:00+00:00",
    "total_price": "89.95",
    "currency": "USD",
    "financial_status": "paid",
    "customer": {
      "id": 1234567890,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "shipping_address": {
      "first_name": "John",
      "last_name": "Doe",
      "address1": "123 Main St",
      "city": "New York",
      "province": "NY",
      "country": "US",
      "zip": "10001"
    },
    "shipping_lines": [
      { "title": "Standard Delivery", "price": "10.00" }
    ],
    "line_items": [
      {
        "id": 111,
        "title": "Chocolate Truffle Cake",
        "quantity": 1,
        "price": "45.00",
        "sku": "CAKE-CHOC-001",
        "variant_title": "8 inch",
        "properties": [
          { "name": "message", "value": "Happy Birthday!" },
          { "name": "color", "value": "Dark Brown" }
        ]
      },
      {
        "id": 222,
        "title": "Assorted Macarons Box",
        "quantity": 2,
        "price": "17.47",
        "sku": "CONF-MAC-012",
        "variant_title": "Box of 12"
      }
    ],
    "note": "Please deliver before 3pm",
    "note_attributes": [
      { "name": "delivery_date", "value": "2026-03-30" },
      { "name": "delivery_time", "value": "2:00 PM - 4:00 PM" },
      { "name": "specific_delivery_time", "value": "3:00 PM" }
    ],
    "tags": ""
  }'
```

**Expected response:** `{ "message": "Webhook accepted", "orderId": 1 }`

### 4. (Optional) Start the Frontend

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3001`, proxies API calls to the backend.

### 5. (Optional) Start the Electron App

```bash
cd electron
npm install
npm start
```

---

## Full Local Test Flow

```bash
# 1. Submit a Shopify webhook
curl -s -X POST http://localhost:3000/api/shopify/order-webhook \
  -H "Content-Type: application/json" \
  -d '{"id":5678901234,"order_number":1042,"name":"#1042","email":"john@example.com","created_at":"2026-03-28T10:30:00Z","customer":{"first_name":"John","last_name":"Doe"},"shipping_lines":[{"title":"Standard Delivery"}],"line_items":[{"title":"Chocolate Cake","quantity":1,"price":"45.00","sku":"CAKE-001"}],"note_attributes":[{"name":"delivery_date","value":"2026-03-30"},{"name":"delivery_time","value":"2-4 PM"}],"tags":""}'

# 2. View the order
curl -s http://localhost:3000/api/orders/1 | python3 -m json.tool

# 3. Sync printers from "Electron app"
curl -s -X POST http://localhost:3000/api/printers/sync \
  -H "Content-Type: application/json" \
  -d '{"machineId":"DESKTOP-ABC123","printers":[{"printerId":"printer1","printerName":"Office Printer","status":"ONLINE"}]}'

# 4. Assign printer to DM department
curl -s -X POST http://localhost:3000/api/printers/assignments \
  -H "Content-Type: application/json" \
  -d '{"department":"DM","printerId":"printer1","machineId":"DESKTOP-ABC123"}'

# 5. Create a print job for DM
curl -s -X POST http://localhost:3000/api/print-job \
  -H "Content-Type: application/json" \
  -d '{"orderId":1,"department":"DM"}'

# 6. Poll for pending jobs (Electron would do this)
curl -s "http://localhost:3000/api/print-jobs/pending?machineId=DESKTOP-ABC123"

# 7. Mark print job as successful
curl -s -X POST http://localhost:3000/api/print-jobs/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"SUCCESS","message":"Printed OK"}'

# 8. Download the DM PDF
curl -s -o dm_order.pdf http://localhost:3000/api/orders/1/department/DM/download-pdf

# 9. Check order timeline
curl -s http://localhost:3000/api/orders/1/timeline | python3 -m json.tool
```

---

## API Reference

### Health Check

```
GET /health
```

### Shopify Webhooks

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/shopify/order-webhook` | Primary webhook endpoint |
| `POST` | `/api/shopify/webhook/order-created` | Legacy alias |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/orders` | List orders (filterable, paginated) |
| `GET` | `/api/orders/:orderId` | Get order with department statuses |
| `GET` | `/api/orders/:orderId/timeline` | Get order timeline events |
| `PATCH` | `/api/orders/:orderId/ignore` | Ignore/un-ignore an order |
| `POST` | `/api/orders/:orderId/department/:department/retry` | Retry print for department |
| `GET` | `/api/orders/:orderId/department/:department/download-pdf` | Download department PDF |

**Filters for `GET /api/orders`:** `view` (`action_required`|`all`), `orderNo`, `orderDate`, `deliveryDate`, `deliverySlot`, `page`, `limit`

### Printers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/printers/sync` | Sync printers from Electron |
| `POST` | `/api/printers/status` | Update printer status |
| `GET` | `/api/printers` | List all printers |
| `POST` | `/api/printers/assignments` | Assign printer to department |
| `GET` | `/api/printers/assignments` | List assignments |

### Print Jobs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/print-job` | Create a print job |
| `GET` | `/api/print-jobs/pending` | List pending jobs |
| `POST` | `/api/print-jobs/:jobId/status` | Update job status |

---

## Data Model

### Department Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `NA` | Grey | Department not required |
| `PENDING` | Orange | Awaiting processing |
| `IN-PROGRESS` | Blue | Print job dispatched |
| `SUCCESS` | Green | Print completed |
| `FAILED` | Red | Print or validation failed |

### Rule Engine

Orders are routed to departments based on:
- **All departments:** Super extended delivery, additional customization charges, missing delivery info, draft orders
- **Designer cake subset:** `DESIGN` + `CONFECTIONERY` (configurable)
- **Default:** All three departments (DM, Confectionery, Design)

### Timeline Events

`WEBHOOK_RECEIVED` → `RULES_EVALUATED` → `PDF_GENERATED` → `PRINT_TRIGGERED` → `PRINT_RESULT`

Other: `PRINTER_VALIDATION_FAILED`, `ORDER_IGNORED`, `ORDER_UNIGNORED`, `PRINT_BLOCKED`
