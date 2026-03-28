# Order Management Automation (OMA) Backend

Node.js backend for processing Shopify order webhooks, evaluating department print rules, generating per-department PDFs (DM, Confectionery, Design), and tracking timeline events.

## Tech Stack

- **Runtime**: Node.js `18.16.1`
- **Framework**: Express.js
- **Database**: MySQL `8.0`
- **PDF**: PDFKit

## Prerequisites

| Tool | Version |
| ----- | ------- |
| Node.js | 18.16.1 |
| MySQL | 8.0+ |

## Local Setup (Step by Step)

### 1. Clone & checkout the feature branch

```bash
git clone https://github.com/ME6-nikit/demo.git
cd demo
git checkout node_order_management
```

### 2. Create the MySQL database

Start your local MySQL 8.0 server, then create the `oma` database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS oma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> **Tip**: If your root user has no password, drop the `-p` flag.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and adjust `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` to match your local MySQL installation. The defaults assume:

| Variable | Default |
| -------- | ------- |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `password` |
| `DB_NAME` | `oma` |

The `SHOPIFY_WEBHOOK_SECRET` is set to a placeholder value; **signature validation is automatically skipped** when the placeholder is used, so local cURL testing works out of the box.

`AUTO_TRIGGER_PRINT_JOBS` is `false` by default so you can test webhook → DB → PDF without needing printers configured.

### 4. Install dependencies

```bash
npm install
```

### 5. Run database migrations

Migrations run automatically on server start (`RUN_MIGRATIONS_ON_BOOT=true`), but you can also run them manually:

```bash
npm run migrate
```

This creates the following tables:

- `orders` — persisted Shopify order data
- `order_department_status` — per-department print status (DM, Confectionery, Design)
- `order_pdfs` — file paths for generated department PDFs
- `order_timeline` — audit log of all events
- `printers`, `department_printer_assignments`, `print_jobs` — printer/job management
- `schema_migrations` — migration tracking

### 6. Start the server

```bash
npm run dev    # with auto-reload (nodemon)
# or
npm start      # plain node
```

You should see:

```
OMA backend listening on port 3000
```

### 7. Verify health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok", "service": "oma-backend" }
```

---

## Testing the Shopify Webhook Locally

### cURL — Post a Sample Shopify Order

Copy and paste the command below to trigger the webhook endpoint. No code changes are needed.

```bash
curl -X POST http://localhost:3000/api/webhooks/shopify/order \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: placeholder" \
  -d '{
    "id": 5551234567890,
    "order_number": 1042,
    "name": "#1042",
    "created_at": "2026-03-28T10:30:00+05:30",
    "email": "jane.doe@example.com",
    "customer": {
      "first_name": "Jane",
      "last_name": "Doe"
    },
    "shipping_lines": [
      { "title": "Standard Delivery", "code": "STANDARD" }
    ],
    "note_attributes": [
      { "name": "delivery_date", "value": "2026-04-02" },
      { "name": "delivery_time", "value": "10:00 AM - 12:00 PM" },
      { "name": "specific_delivery_time", "value": "11:00 AM" }
    ],
    "line_items": [
      {
        "title": "Chocolate Truffle Cake - 1kg",
        "quantity": 1,
        "price": "1250.00"
      },
      {
        "title": "Red Velvet Cupcakes (Box of 6)",
        "quantity": 2,
        "price": "650.00"
      },
      {
        "title": "Custom Message Plaque",
        "quantity": 1,
        "price": "150.00"
      }
    ],
    "tags": "",
    "total_price": "2700.00",
    "currency": "INR"
  }'
```

**Expected response** (HTTP 202):

```json
{
  "message": "Webhook accepted",
  "orderId": 1
}
```

You can also use the sample payload file:

```bash
curl -X POST http://localhost:3000/api/webhooks/shopify/order \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: placeholder" \
  -d @docs/sample-webhook-payload.json
```

### What happens behind the scenes

1. **Signature validation** — skipped when using the placeholder secret (local dev mode).
2. **Order persisted** — row inserted into `orders` table.
3. **Department statuses initialized** — `order_department_status` row created with `PENDING` for DM, Confectionery, and Design.
4. **Rule engine evaluated** — determines which departments need PDFs.
5. **PDFs generated** — one PDF per required department saved to `storage/pdfs/`.
6. **Timeline logged** — events: `WEBHOOK_RECEIVED`, `RULES_EVALUATED`, `PDF_GENERATED` (×3).

### Verify in MySQL

```bash
mysql -u root -p oma -e "SELECT id, order_id, order_number, customer_name FROM orders;"
mysql -u root -p oma -e "SELECT * FROM order_department_status;"
mysql -u root -p oma -e "SELECT * FROM order_pdfs;"
mysql -u root -p oma -e "SELECT event_type, status, department, message FROM order_timeline ORDER BY id;"
```

### Verify generated PDFs

```bash
ls -la storage/pdfs/
```

---

## Downloading a Department PDF

Use the download endpoint to retrieve a generated PDF:

```bash
# Download the DM department PDF for order with internal ID 1
curl -o dm_order.pdf http://localhost:3000/api/orders/1/department/dm/download-pdf

# Download the Confectionery department PDF
curl -o confectionery_order.pdf http://localhost:3000/api/orders/1/department/confectionery/download-pdf

# Download the Design department PDF
curl -o design_order.pdf http://localhost:3000/api/orders/1/department/design/download-pdf
```

The `{orderId}` parameter accepts either the internal numeric ID or the Shopify order ID.
The `{department}` parameter accepts: `dm`, `confectionery`, or `design` (case-insensitive).

---

## All API Endpoints

### Shopify Webhook

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/webhooks/shopify/order` | **Primary** — Receive Shopify order webhook |
| `POST` | `/api/shopify/order-webhook` | Alias |
| `POST` | `/api/shopify/webhook/order-created` | Legacy alias |

### Orders

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/orders` | List orders (supports filters & pagination) |
| `GET` | `/api/orders/:orderId` | Get single order with department statuses |
| `GET` | `/api/orders/:orderId/timeline` | Get order timeline events |
| `PATCH` | `/api/orders/:orderId/ignore` | Mark/unmark order as ignored |
| `POST` | `/api/orders/:orderId/department/:department/retry` | Retry print for a department |
| `GET` | `/api/orders/:orderId/department/:department/download-pdf` | Download department PDF |

### Printers

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/printers` | List all printers |
| `GET` | `/api/printers/assignments` | List department→printer assignments |
| `POST` | `/api/printers/sync` | Sync printers from Electron app |
| `POST` | `/api/printers/status` | Update printer status |
| `POST` | `/api/printers/assignments` | Assign printer to department |

### Print Jobs

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/print-job` | Create a print job |
| `GET` | `/api/print-jobs/pending` | List pending print jobs |
| `POST` | `/api/print-jobs/:jobId/status` | Update print job status |

---

## Database Schema

Migration file: `src/db/migrations/001_init_schema.sql`

### Core Tables

**`orders`** — Shopify order data

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | BIGINT (PK) | Auto-increment |
| `order_id` | VARCHAR(64) | Shopify order ID (unique) |
| `order_number` | VARCHAR(64) | Display order number |
| `customer_name` | VARCHAR(255) | |
| `delivery_date` | DATE | |
| `delivery_time` | VARCHAR(64) | |
| `shipping_method` | VARCHAR(255) | |

**`order_department_status`** — Per-department print status

| Column | Type | Values |
| ------ | ---- | ------ |
| `order_id` | BIGINT (FK→orders.id) | |
| `dm_status` | ENUM | `NA`, `PENDING`, `IN-PROGRESS`, `SUCCESS`, `FAILED` |
| `confectionery_status` | ENUM | `NA`, `PENDING`, `IN-PROGRESS`, `SUCCESS`, `FAILED` |
| `design_status` | ENUM | `NA`, `PENDING`, `IN-PROGRESS`, `SUCCESS`, `FAILED` |

**`order_pdfs`** — Generated PDF file paths

| Column | Type |
| ------ | ---- |
| `order_id` | BIGINT (FK→orders.id) |
| `dm_pdf_path` | TEXT |
| `confectionery_pdf_path` | TEXT |
| `design_pdf_path` | TEXT |

**`order_timeline`** — Audit trail

| Column | Type |
| ------ | ---- |
| `id` | BIGINT (PK) |
| `order_id` | BIGINT (FK→orders.id) |
| `event_type` | VARCHAR(128) |
| `status` | VARCHAR(64) |
| `message` | TEXT |
| `timestamp` | TIMESTAMP |

---

## Department Status Model

| Status | Color | Meaning |
| ------ | ----- | ------- |
| `NA` | Grey | Department not required for this order |
| `PENDING` | Orange | Awaiting processing |
| `IN-PROGRESS` | Blue | Print job in progress |
| `SUCCESS` | Green | Print completed successfully |
| `FAILED` | Red | Print failed |

At webhook ingest time, all three department statuses are initialized to `PENDING` (or `NA` based on rule engine evaluation).

---

## Architecture

```
src/
  server.js           — Bootstrap: migrations + HTTP listener
  app.js              — Express app: middleware, routes, error handling
  config/
    env.js            — Environment variable parsing
  db/
    pool.js           — MySQL connection pool
    migrate.js        — Migration runner
    migrations/       — SQL migration files
  constants/
    departments.js    — Department enum & list
    statuses.js       — Status enums & color map
  controllers/        — HTTP request/response layer
  services/           — Business logic & workflows
  repositories/       — Data access & SQL queries
  middleware/         — Error handling, 404
  routes/             — Express route definitions
  utils/              — Helpers (HMAC, order mapper, presenter)
```

## Timeline Events

| Event | When |
| ----- | ---- |
| `WEBHOOK_RECEIVED` | Shopify webhook processed |
| `RULES_EVALUATED` | Rule engine determined departments |
| `PDF_GENERATED` | PDF created for a department |
| `PDF_DOWNLOADED` | PDF successfully downloaded |
| `PDF_DOWNLOAD_FAILED` | PDF download failed |
| `PRINT_TRIGGERED` | Print job queued |
| `PRINT_RESULT` | Print job completed/failed |
| `PRINTER_VALIDATION_FAILED` | No valid printer for department |
| `ORDER_IGNORED` | Order marked as ignored |
| `ORDER_UNIGNORED` | Order un-ignored |
