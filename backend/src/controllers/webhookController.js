const { processShopifyOrder } = require("../services/orderService");
const { verifyShopifyWebhook } = require("../utils/shopify");
const { shopifyWebhookSecret } = require("../config/env");

async function receiveShopifyOrder(req, res, next) {
  try {
    const hmac = req.get("x-shopify-hmac-sha256");
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyShopifyWebhook(rawBody, hmac, shopifyWebhookSecret);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid Shopify webhook signature" });
    }

    const payload = req.body;
    const result = await processShopifyOrder(payload);
    return res.status(202).json({ message: "Webhook processed", order: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = { receiveShopifyOrder };
