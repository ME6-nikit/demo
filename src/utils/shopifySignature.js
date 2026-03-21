const crypto = require("crypto");

function validateShopifyWebhookSignature(rawBody, signature, secret) {
  if (!secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature || "");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

module.exports = {
  validateShopifyWebhookSignature,
};
