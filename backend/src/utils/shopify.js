const crypto = require("crypto");

function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!secret) return true;
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

module.exports = { verifyShopifyWebhook };
