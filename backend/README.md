# OMA Backend (Node 18.16.1 + MySQL 8)

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Make sure MySQL 8 is running and `DB_NAME` exists.
4. Start:
   ```bash
   npm run dev
   ```

The server boots tables automatically at startup.

## Core APIs

- `POST /api/webhooks/shopify/orders/create` - Shopify order webhook ingestion
- `POST /api/printers/sync`
- `POST /api/printers/status`
- `GET /api/printers`
- `PATCH /api/printers/:printerId` (activate/deactivate + department assignment)
- `POST /api/print-job` (manual submit or desktop polling using `machine_id`)
- `POST /api/print-job/status`
- `GET /api/orders?actionRequired=true|false`
- `PATCH /api/orders/:orderId/ignore`
- `GET /api/orders/:orderId/timeline`
- `GET /api/orders/:orderId/department/:department/download-pdf`

## OMA dummy order + row data

Use `backend/dummy-data/` for practical examples requested by QA/ops:

- Shopify payloads:
  - `shopify-order-default.json` (default rule, all departments)
  - `shopify-order-designer-cake.json` (designer-cake rule, Design = `NA`)
  - `shopify-order-customization-charge.json` (customization-charge rule)
- MySQL seed rows:
  - `oma-dummy-rows.sql` (Orders, Order Department Status, Order PDFs, Printers, Order Timeline)

Quick run:

```bash
curl -X POST http://localhost:4000/api/webhooks/shopify/orders/create \
  -H "Content-Type: application/json" \
  --data @backend/dummy-data/shopify-order-default.json
```

```bash
mysql -h 127.0.0.1 -u root -proot oma < backend/dummy-data/oma-dummy-rows.sql
```
