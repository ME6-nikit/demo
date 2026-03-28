const express = require("express");
const printJobController = require("../controllers/printJobController");

const router = express.Router();

router.post("/", printJobController.createPrintJob);
router.get("/pending", printJobController.listPendingJobs);
router.post("/:jobId/status", printJobController.updatePrintJobStatus);

module.exports = router;
