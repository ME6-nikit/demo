const env = require("../config/env");
const { validateShopifyWebhookSignature } = require("../utils/shopifySignature");
const shopifyService = require("../services/shopifyService");
const HttpError = require("../utils/httpError");

function parseRawJsonBody(req) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!rawBody) {
    throw new HttpError(400, "Missing JSON body");
  }

  try {
    return {
      rawBody,
      payload: JSON.parse(rawBody),
    };
  } catch (_error) {
    throw new HttpError(400, "Invalid JSON payload");
  }
}

function validateSampleWebhookSignature(rawBody, signature) {
  // Placeholder: if signature is provided and secret exists, validate Shopify HMAC.
  // Keeping this lenient for local/sample endpoint testing.
  if (!signature || !env.shopifyWebhookSecret) {
    return true;
  }
  return validateShopifyWebhookSignature(rawBody, signature, env.shopifyWebhookSecret);
}

async function handleOrderCreatedWebhook(req, res, next) {
  try {
    const signature = req.get("x-shopify-hmac-sha256");
    const { rawBody, payload } = parseRawJsonBody(req);
    const isValid = validateShopifyWebhookSignature(rawBody, signature, env.shopifyWebhookSecret);
    if (!isValid) {
      throw new HttpError(401, "Invalid Shopify webhook signature");
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

async function handleSampleOrderWebhook(req, res, next) {
  try {
    const signature = req.get("x-shopify-hmac-sha256");
    const { rawBody, payload } = parseRawJsonBody(req);
    const isValid = validateSampleWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new HttpError(401, "Invalid sample webhook signature");
    }

    const result = await shopifyService.processSampleOrderWebhook(payload);
    res.status(201).json({
      success: true,
      order_id: result.shopifyOrderId,
      order_number: result.orderNumber,
      internal_order_id: result.internalOrderId,
      message: "Sample webhook processed",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleOrderCreatedWebhook,
  handleSampleOrderWebhook,
};
