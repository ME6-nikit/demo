# Order Management Automation (OMA) Backend

Production-style Node.js backend for processing Shopify order webhooks, evaluating department print rules, generating per-department PDFs, validating printer assignments, dispatching print jobs, and tracking timeline events.

## Tech Stack

- Node.js `18.16.1`
- Express
- MySQL 8

## Quick Start

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run migrations:

   ```bash
   npm run migrate
   ```

4. Start server:

   ```bash
   npm run dev
   ```

Health endpoint:

```http
GET /health
```

## Architecture

```
src/
  app.js
  server.js
  config/
  db/
  constants/
  controllers/
  routes/
  services/
  repositories/
  middleware/
  utils/
```

- **controllers**: HTTP request/response layer.
- **services**: business workflows and domain logic.
- **repositories**: data access and SQL queries.
- **utils/constants**: reusable helpers, enums, and mappers.

## Core Data Model

Migration: `src/db/migrations/001_init_schema.sql`

Tables:

- `orders`
- `order_department_status`
- `order_pdfs`
- `printers`
- `department_printer_assignments`
- `print_jobs`
- `order_timeline`
- `schema_migrations`

Department statuses: `NA`, `PENDING`, `IN-PROGRESS`, `SUCCESS`, `FAILED`

Status color mapping in API responses:

- `NA` → `Grey`
- `PENDING` → `Orange`
- `IN-PROGRESS` → `Blue`
- `SUCCESS` → `Green`
- `FAILED` → `Red`

## Implemented APIs

### Shopify webhook

- `POST /api/shopify/order-webhook` (Shopify-compatible endpoint)
- `POST /api/shopify/webhook/order-created` (legacy alias)
  - Validates Shopify HMAC signature via `x-shopify-hmac-sha256`
  - Persists order + initializes statuses
  - Evaluates business rules
  - Generates department PDFs
  - Validates printers and auto-creates print jobs (configurable)
  - Logs timeline events
- `POST /api/shopify/sample-order-webhook` (developer-friendly alias for local testing)
- `POST /api/shopify/test-order-webhook` (end-to-end local webhook-to-print test endpoint)
  - Accepts Shopify-like order payloads
  - Uses the same rule engine + status initialization as production webhook processing
  - Generates department PDFs and stores paths in `order_pdfs`
  - Triggers print jobs using printer validation and timeline logging flow

### End-to-end Local Test: Webhook to Print

This flow lets you simulate a local Shopify webhook and drive order insertion, rules, PDF generation, and print-job creation end to end.

#### 1) (Optional) Make sure printers are synced and assigned

```bash
curl -X POST "http://localhost:3000/api/printers/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "local-machine-1",
    "printers": [
      { "printerId": "printer-main", "printerName": "Main Thermal Printer", "status": "ONLINE", "isActive": true }
    ]
  }'
```

Assign the printer to each department (same printer is fine for local test):

```bash
curl -X POST "http://localhost:3000/api/printers/assignments" \
  -H "Content-Type: application/json" \
  -d '{ "department": "DM", "printerId": "printer-main", "machineId": "local-machine-1" }'
```

```bash
curl -X POST "http://localhost:3000/api/printers/assignments" \
  -H "Content-Type: application/json" \
  -d '{ "department": "CONFECTIONERY", "printerId": "printer-main", "machineId": "local-machine-1" }'
```

```bash
curl -X POST "http://localhost:3000/api/printers/assignments" \
  -H "Content-Type: application/json" \
  -d '{ "department": "DESIGN", "printerId": "printer-main", "machineId": "local-machine-1" }'
```

#### 2) Call the test webhook endpoint

**Endpoint**

```http
POST /api/shopify/test-order-webhook
```

**Sample Shopify-like payload**

```json
{
  "id": "900100201",
  "order_number": "OMA-1002",
  "created_at": "2026-03-21T10:30:00Z",
  "customer": {
    "first_name": "Jane",
    "last_name": "Doe"
  },
  "shipping_lines": [
    { "title": "Standard Delivery", "code": "STANDARD" }
  ],
  "note_attributes": [
    { "name": "delivery_date", "value": "2026-03-25" },
    { "name": "delivery_time", "value": "10:00-12:00" },
    { "name": "specific_delivery_time", "value": "10:30 AM" },
    { "name": "reserved", "value": "false" }
  ],
  "line_items": [
    { "title": "Designer Cake - Anniversary" },
    { "title": "Additional Customization Charges" }
  ]
}
```

**cURL**

```bash
curl -X POST "http://localhost:3000/api/shopify/test-order-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "900100201",
    "order_number": "OMA-1002",
    "created_at": "2026-03-21T10:30:00Z",
    "customer": { "first_name": "Jane", "last_name": "Doe" },
    "shipping_lines": [{ "title": "Standard Delivery", "code": "STANDARD" }],
    "note_attributes": [
      { "name": "delivery_date", "value": "2026-03-25" },
      { "name": "delivery_time", "value": "10:00-12:00" },
      { "name": "specific_delivery_time", "value": "10:30 AM" },
      { "name": "reserved", "value": "false" }
    ],
    "line_items": [
      { "title": "Designer Cake - Anniversary" },
      { "title": "Additional Customization Charges" }
    ]
  }'
```

#### 3) Verify generated print jobs (Electron polling)

```bash
curl "http://localhost:3000/api/print-jobs/pending?machineId=local-machine-1&limit=50"
```

The test webhook response includes:
- created order IDs
- required departments
- generated PDF paths
- queued print-job metadata

If Electron is running and polling pending jobs, it should receive and print these jobs. In DB you should also see:
- `orders` row created
- `order_department_status` updated by rule evaluation
- `order_pdfs` paths populated
- `print_jobs` rows inserted
- `order_timeline` events for webhook/rules/pdf/print flow

### Orders

- `GET /api/orders`
  - Query params:
    - `view=action_required|all` (default: `action_required`)
    - `orderNo`
    - `orderDate` (`YYYY-MM-DD`)
    - `deliveryDate` (`YYYY-MM-DD`)
    - `deliverySlot`
    - `page`, `limit`
- `GET /api/orders/:orderId`
- `GET /api/orders/:orderId/timeline`
- `PATCH /api/orders/:orderId/ignore`
  - Body: `{ "isIgnored": true|false }`
- `POST /api/orders/:orderId/department/:department/retry`
- `GET /api/orders/:orderId/department/:department/download-pdf`

### Printers (Electron + admin mapping support)

- `POST /api/printers/sync`
  - Body: `{ "machineId": "...", "printers": [...] }`
- `POST /api/printers/status`
- `POST /api/printers/assignments`
  - Body: `{ "department": "DM|CONFECTIONERY|DESIGN", "printerId": "...", "machineId": "..." }`
- `GET /api/printers`
- `GET /api/printers/assignments`

### Print jobs

- `POST /api/print-job`
  - Body: `{ "orderId": "...", "department": "DM|CONFECTIONERY|DESIGN" }`
- `GET /api/print-jobs/pending?machineId=<machineId>&limit=50`
- `POST /api/print-jobs/:jobId/status`
  - Body: `{ "status": "IN-PROGRESS|SUCCESS|FAILED|CANCELLED", "message": "optional" }`

## Timeline Events Logged

- `WEBHOOK_RECEIVED`
- `RULES_EVALUATED`
- `PDF_GENERATED` (per department)
- `PRINT_TRIGGERED` (per department)
- `PRINT_RESULT` (per department)
- `PRINTER_VALIDATION_FAILED`
- `ORDER_IGNORED`
- `ORDER_UNIGNORED`

## Notes

- PDF generation is implemented with `pdfkit` and stored under `PDF_STORAGE_DIR`.
- If an order is ignored, print job creation is blocked and pending jobs are cancelled.
- Printer validation checks assignment, active state, and online status.
