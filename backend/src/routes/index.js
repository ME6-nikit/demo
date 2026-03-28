const express = require("express");
const shopifyRoutes = require("./shopifyRoutes");
const orderRoutes = require("./orderRoutes");
const printerRoutes = require("./printerRoutes");
const printJobRoutes = require("./printJobRoutes");

const router = express.Router();

router.use("/shopify/webhook", shopifyRoutes);
router.use("/orders", orderRoutes);
router.use("/printers", printerRoutes);
router.use("/print-job", printJobRoutes);
router.use("/print-jobs", printJobRoutes);

module.exports = router;
