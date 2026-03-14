# OMA Dummy Data (Webhook + MySQL rows)

This folder provides practical test data for OMA flows.

## Included scenarios

1. **Default rule (all departments)**
   - File: `shopify-order-default.json`
   - Expected: DM, Confectionery, Design all require printing.

2. **Designer cake rule**
   - File: `shopify-order-designer-cake.json`
   - Expected: Design = `NA`, DM + Confectionery remain printable.

3. **Additional customization charges rule**
   - File: `shopify-order-customization-charge.json`
   - Expected: all departments require printing.

## SQL row data

Use `oma-dummy-rows.sql` to seed consistent rows for:
- `printers`
- `orders`
- `order_department_status`
- `order_pdfs`
- `order_timeline`

All rows use matching IDs across tables (for example `order_id=900001/900002/900003`).

## Quick usage

### A) Trigger via webhook API

```bash
curl -X POST http://localhost:4000/api/webhooks/shopify/orders/create \
  -H "Content-Type: application/json" \
  --data @backend/dummy-data/shopify-order-default.json
```

Run similarly for:
- `shopify-order-designer-cake.json`
- `shopify-order-customization-charge.json`

### B) Seed DB rows directly

```bash
mysql -h 127.0.0.1 -u root -proot oma < backend/dummy-data/oma-dummy-rows.sql
```

After seeding, open:
- `GET /api/orders?actionRequired=true`
- `GET /api/orders?actionRequired=false`
- `GET /api/orders/900002/timeline`
