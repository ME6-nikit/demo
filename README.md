# Order Management Automation (OMA) Backend

Production-style Node.js backend for processing Shopify order webhooks, evaluating department print rules, generating per-department PDFs, validating printer assignments, dispatching print jobs, and tracking timeline events.

## Tech Stack

- Node.js `18.16.1`
- Express
- MySQL 8

## Push Notifications on Repository Push

This repository includes a GitHub Actions workflow at `.github/workflows/push-notification.yml`.
It runs on every `push` and sends a JSON notification payload to a webhook URL.

To enable it:

1. In GitHub, open **Settings → Secrets and variables → Actions**.
2. Add a repository secret named `PUSH_NOTIFICATION_WEBHOOK_URL`.
3. Set the value to your webhook endpoint (Slack/Discord/custom service).

If the secret is not configured, the workflow exits gracefully and logs a skip message.

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

- `POST /api/shopify/order-webhook` (spec-compatible sample endpoint)
- `POST /api/shopify/webhook/order-created` (legacy alias)
  - Validates Shopify HMAC signature via `x-shopify-hmac-sha256`
  - Persists order + initializes statuses
  - Evaluates business rules
  - Generates department PDFs
  - Validates printers and auto-creates print jobs (configurable)
  - Logs timeline events

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
