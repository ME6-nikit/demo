const express = require("express");
const shopifyController = require("../controllers/shopifyController");

const router = express.Router();

router.post("/order-created", express.raw({ type: "application/json" }), shopifyController.handleOrderCreatedWebhook);

module.exports = router;
