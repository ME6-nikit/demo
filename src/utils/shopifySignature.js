const crypto = require("crypto");

function computeHmacDigest(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

/**
 * Validates the Shopify HMAC-SHA256 webhook signature.
 *
 * When `secret` is falsy or set to a known placeholder value, validation is
 * skipped so the webhook can be triggered locally without a real Shopify
 * secret. In production, always set SHOPIFY_WEBHOOK_SECRET to the real value
 * from the Shopify partner dashboard.
 */
function validateShopifyWebhookSignature(rawBody, signature, secret) {
  const skipPlaceholders = ["", "test-webhook-secret", "replace-with-shopify-webhook-secret"];
  if (!secret || skipPlaceholders.includes(secret)) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const digest = computeHmacDigest(rawBody, secret);
  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

module.exports = {
  validateShopifyWebhookSignature,
  computeHmacDigest,
};
