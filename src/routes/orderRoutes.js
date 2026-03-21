const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get("/", orderController.listOrders);
router.get("/:orderId", orderController.getOrderById);
router.get("/:orderId/timeline", orderController.getOrderTimeline);
router.patch("/:orderId/ignore", orderController.updateIgnoreStatus);
router.post("/:orderId/department/:department/retry", orderController.retryDepartmentPrint);
router.get("/:orderId/department/:department/download-pdf", orderController.downloadDepartmentPdf);

module.exports = router;
