const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get("/", orderController.list);
router.get("/:orderId/timeline", orderController.timeline);
router.patch("/:orderId/ignore", orderController.updateIgnore);
router.get(
  "/:orderId/department/:department/download-pdf",
  orderController.downloadDepartmentPdf
);

module.exports = router;
