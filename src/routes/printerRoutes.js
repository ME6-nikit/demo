const express = require("express");
const printerController = require("../controllers/printerController");

const router = express.Router();

router.get("/", printerController.listPrinters);
router.get("/assignments", printerController.listAssignments);
router.post("/sync", printerController.syncPrinters);
router.post("/status", printerController.updatePrinterStatus);
router.post("/assignments", printerController.assignPrinter);

module.exports = router;
