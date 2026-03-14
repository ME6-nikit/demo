const express = require("express");
const { receiveShopifyOrder } = require("../controllers/webhookController");

const router = express.Router();

router.post("/shopify/orders/create", receiveShopifyOrder);

module.exports = router;
