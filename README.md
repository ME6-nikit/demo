# Order Management Automation (OMA) — Backend

A Node.js + Express backend for processing Shopify order webhooks, evaluating department print rules, generating per-department PDFs, managing printer assignments, dispatching print jobs, and tracking timeline events.

## Tech Stack

- **Runtime:** Node.js `>=18.0.0` (developed with 18.16.1)
- **Framework:** Express 4.x
- **Database:** MySQL 8.0
- **PDF Generation:** PDFKit

## Quick Start (Local Development)

### 1. Start MySQL

**Option A — Docker Compose (recommended):**

```bash
docker-compose up -d
```

This starts a MySQL 8.0 container on port 3306 with:
- Root password: `password`
- Database: `oma` (auto-created)

**Option B — Local MySQL 8.0 installation:**

```sql
CREATE DATABASE IF NOT EXISTS oma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Default values in `.env.example` match the Docker Compose setup. No changes needed for local dev.

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | `password` | MySQL password |
| `DB_NAME` | `oma` | Database name |
| `SHOPIFY_WEBHOOK_SECRET` | `test-webhook-secret` | Set to `test-webhook-secret` to bypass HMAC in dev |
| `PDF_STORAGE_DIR` | `storage/pdfs` | Where generated PDFs are stored |
| `AUTO_TRIGGER_PRINT_JOBS` | `false` | Auto-create print jobs when webhook arrives |
| `RUN_MIGRATIONS_ON_BOOT` | `true` | Run DB migrations on server start |

### 3. Install & Run

```bash
npm install
npm run dev
```

The server will:
1. Wait for the database connection (retries up to 15 times)
2. Run migrations automatically (creates all tables)
3. Start listening on `http://localhost:3000`

### 4. Verify

```bash
curl http://localhost:3000/health
```

---

## Sample Curl: Shopify Webhook

This simulates a Shopify order creation webhook with a realistic payload:

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

**Expected response:**
```json
{ "message": "Webhook accepted", "orderId": 1 }
```

This will:
1. Validate the webhook signature (bypassed in dev mode)
2. Store the order in the `orders` table
3. Initialize department statuses (`DM`, `CONFECTIONERY`, `DESIGN`) to `PENDING`
4. Generate 3 department-specific PDFs under `storage/pdfs/`
5. Log timeline events (`WEBHOOK_RECEIVED`, `RULES_EVALUATED`, `PDF_GENERATED` × 3)

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

Headers: `x-shopify-hmac-sha256` (required in production, bypassed when secret is `test-webhook-secret`)

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/orders` | List orders (filterable, paginated) |
| `GET` | `/api/orders/:orderId` | Get single order with department statuses |
| `GET` | `/api/orders/:orderId/timeline` | Get order timeline events |
| `PATCH` | `/api/orders/:orderId/ignore` | Ignore/un-ignore an order |
| `POST` | `/api/orders/:orderId/department/:department/retry` | Retry print for a department |
| `GET` | `/api/orders/:orderId/department/:department/download-pdf` | Download department PDF |

**Query parameters for `GET /api/orders`:**

| Param | Example | Description |
|-------|---------|-------------|
| `view` | `action_required` (default) or `all` | Filter by actionable status |
| `orderNo` | `1042` | Search by order number |
| `orderDate` | `2026-03-28` | Filter by order date |
| `deliveryDate` | `2026-03-30` | Filter by delivery date |
| `deliverySlot` | `3:00 PM` | Filter by delivery time slot |
| `page` | `1` | Page number |
| `limit` | `25` | Results per page (max 100) |

### Printers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/printers/sync` | Sync printers from Electron app |
| `POST` | `/api/printers/status` | Update printer status |
| `GET` | `/api/printers` | List all printers |
| `POST` | `/api/printers/assignments` | Assign printer to department |
| `GET` | `/api/printers/assignments` | List department-printer assignments |

**Sync printers body:**
```json
{
  "machineId": "DESKTOP-ABC123",
  "printers": [
    { "printerId": "HP_LaserJet_Pro", "printerName": "HP LaserJet Pro M404", "status": "ONLINE" }
  ]
}
```

### Print Jobs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/print-job` | Create a print job |
| `GET` | `/api/print-jobs/pending` | List pending print jobs |
| `POST` | `/api/print-jobs/:jobId/status` | Update print job status |

**Create print job body:**
```json
{ "orderId": 1, "department": "DM" }
```

**List pending jobs query:**
```
GET /api/print-jobs/pending?machineId=DESKTOP-ABC123&limit=50
```

**Update job status body:**
```json
{ "status": "SUCCESS", "message": "Print completed" }
```

Valid statuses: `PENDING`, `IN-PROGRESS`, `SUCCESS`, `FAILED`, `CANCELLED`

---

## Full Local Test Flow

After starting the server, run these commands in order to exercise the full workflow:

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

## Architecture

```
src/
├── app.js                         # Express app setup, middleware, route mounting
├── server.js                      # Bootstrap: DB wait, migrations, listen
├── config/
│   └── env.js                     # Environment variable parsing
├── constants/
│   ├── departments.js             # DM, CONFECTIONERY, DESIGN
│   └── statuses.js                # Status enums + color map
├── controllers/
│   ├── shopifyController.js       # Webhook HMAC validation + dispatch
│   ├── orderController.js         # Order CRUD + PDF download
│   ├── printerController.js       # Printer sync/status/assignment
│   └── printJobController.js      # Print job CRUD
├── db/
│   ├── pool.js                    # MySQL connection pool + transaction helper
│   ├── migrate.js                 # Migration runner
│   └── migrations/
│       └── 001_init_schema.sql    # Full schema
├── middleware/
│   ├── errorHandler.js            # Global error handler
│   └── notFound.js                # 404 handler
├── repositories/
│   ├── orderRepository.js         # Order SQL queries
│   ├── printerRepository.js       # Printer SQL queries
│   ├── printJobRepository.js      # Print job SQL queries
│   └── timelineRepository.js      # Timeline SQL queries
├── routes/
│   ├── shopifyRoutes.js
│   ├── orderRoutes.js
│   ├── printerRoutes.js
│   └── printJobRoutes.js
├── services/
│   ├── shopifyService.js          # Webhook processing orchestrator
│   ├── orderService.js            # Order business logic
│   ├── pdfService.js              # PDF generation (PDFKit)
│   ├── printerService.js          # Printer validation + management
│   ├── printJobService.js         # Print job lifecycle
│   ├── ruleEngineService.js       # Department selection rules
│   └── timelineService.js         # Event logging
└── utils/
    ├── departmentUtils.js         # Department normalization helpers
    ├── httpError.js               # Custom error class
    ├── orderPresenter.js          # API response formatting
    ├── shopifyOrderMapper.js      # Shopify payload → normalized order
    └── shopifySignature.js        # HMAC-SHA256 verification
```

## Data Model

### Tables

| Table | Purpose |
|-------|---------|
| `orders` | Core order data from Shopify |
| `order_department_status` | Per-order department statuses (DM, Confectionery, Design) |
| `order_pdfs` | PDF file paths per department |
| `printers` | Registered printers from Electron |
| `department_printer_assignments` | Which printer handles which department |
| `print_jobs` | Print job queue and status |
| `order_timeline` | Audit log of all events |

### Department Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `NA` | Grey | Department not required for this order |
| `PENDING` | Orange | Awaiting processing |
| `IN-PROGRESS` | Blue | Print job dispatched |
| `SUCCESS` | Green | Print completed |
| `FAILED` | Red | Print or validation failed |

### Rule Engine

The rule engine evaluates each incoming order to determine which departments are required:

- **All departments required:** Super extended delivery, additional customization charges, missing delivery info, or draft orders
- **Designer cake subset:** Only `DESIGN` + `CONFECTIONERY` (configurable via `DESIGNER_CAKE_DEPARTMENTS`)
- **Default:** All three departments

### Timeline Events

`WEBHOOK_RECEIVED` → `RULES_EVALUATED` → `PDF_GENERATED` (per dept) → `PRINT_TRIGGERED` (per dept) → `PRINT_RESULT` (per dept)

Other events: `PRINTER_VALIDATION_FAILED`, `ORDER_IGNORED`, `ORDER_UNIGNORED`, `PRINT_BLOCKED`
