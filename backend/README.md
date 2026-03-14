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
