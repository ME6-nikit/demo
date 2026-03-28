const env = require("../config/env");
const { validateShopifyWebhookSignature } = require("../utils/shopifySignature");
const shopifyService = require("../services/shopifyService");
const HttpError = require("../utils/httpError");

async function handleOrderCreatedWebhook(req, res, next) {
  try {
    const signature = req.get("x-shopify-hmac-sha256") || "";
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    if (!rawBody) {
      throw new HttpError(400, "Empty request body");
    }

    const isValid = validateShopifyWebhookSignature(rawBody, signature, env.shopifyWebhookSecret);
    if (!isValid) {
      throw new HttpError(401, "Invalid Shopify webhook signature");
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (_error) {
      throw new HttpError(400, "Invalid JSON payload");
    }

    const orderId = await shopifyService.processOrderWebhook(payload);
    res.status(202).json({
      message: "Webhook accepted",
      orderId,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleOrderCreatedWebhook,
};
