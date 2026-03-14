const express = require("express");
const printerRoutes = require("./printerRoutes");
const printJobRoutes = require("./printJobRoutes");
const orderRoutes = require("./orderRoutes");
const webhookRoutes = require("./webhookRoutes");

const router = express.Router();

router.use("/printers", printerRoutes);
router.use("/print-job", printJobRoutes);
router.use("/orders", orderRoutes);
router.use("/webhooks", webhookRoutes);

module.exports = router;
