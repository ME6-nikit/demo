#!/usr/bin/env bash
# ============================================================================
# OMA Backend — cURL Examples for Local Testing
# ============================================================================
# Prerequisites:
#   1. MySQL 8.0 running with the 'oma' database created
#   2. Server started: npm run dev
#   3. .env copied from .env.example (defaults work for local testing)
# ============================================================================

BASE_URL="http://localhost:3000"

# --------------------------------------------------------------------------
# 1. Health Check
# --------------------------------------------------------------------------
echo "=== Health Check ==="
curl -s "${BASE_URL}/health" | python3 -m json.tool
echo ""

# --------------------------------------------------------------------------
# 2. POST Shopify Order Webhook
#    The HMAC header is a placeholder; signature validation is skipped in
#    local dev mode (when SHOPIFY_WEBHOOK_SECRET is the default placeholder).
# --------------------------------------------------------------------------
echo "=== Shopify Webhook — Create Order ==="
curl -s -X POST "${BASE_URL}/api/webhooks/shopify/order" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: placeholder" \
  -d @"$(dirname "$0")/sample-webhook-payload.json" | python3 -m json.tool
echo ""

# --------------------------------------------------------------------------
# 3. List Orders
# --------------------------------------------------------------------------
echo "=== List Orders ==="
curl -s "${BASE_URL}/api/orders?view=all" | python3 -m json.tool
echo ""

# --------------------------------------------------------------------------
# 4. Get Single Order (replace 1 with the actual order id)
# --------------------------------------------------------------------------
echo "=== Get Order Details ==="
curl -s "${BASE_URL}/api/orders/1" | python3 -m json.tool
echo ""

# --------------------------------------------------------------------------
# 5. Get Order Timeline
# --------------------------------------------------------------------------
echo "=== Order Timeline ==="
curl -s "${BASE_URL}/api/orders/1/timeline" | python3 -m json.tool
echo ""

# --------------------------------------------------------------------------
# 6. Download Department PDFs
# --------------------------------------------------------------------------
echo "=== Download DM PDF ==="
curl -s -o dm_order.pdf "${BASE_URL}/api/orders/1/department/dm/download-pdf"
echo "Saved to dm_order.pdf"

echo "=== Download Confectionery PDF ==="
curl -s -o confectionery_order.pdf "${BASE_URL}/api/orders/1/department/confectionery/download-pdf"
echo "Saved to confectionery_order.pdf"

echo "=== Download Design PDF ==="
curl -s -o design_order.pdf "${BASE_URL}/api/orders/1/department/design/download-pdf"
echo "Saved to design_order.pdf"

echo ""
echo "Done! Check the downloaded PDF files and the database tables."
