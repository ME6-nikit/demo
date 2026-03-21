const express = require("express");
const shopifyController = require("../controllers/shopifyController");

const router = express.Router();

router.post("/order-created", express.raw({ type: "application/json" }), shopifyController.handleOrderCreatedWebhook);
router.post("/order-webhook", express.raw({ type: "application/json" }), shopifyController.handleOrderCreatedWebhook);
router.post(
  "/sample-order-webhook",
  express.raw({ type: "application/json" }),
  shopifyController.handleSampleOrderWebhook
);
router.post("/test-order-webhook", express.raw({ type: "application/json" }), shopifyController.handleTestOrderWebhook);

module.exports = router;
