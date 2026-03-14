const express = require("express");
const printJobController = require("../controllers/printJobController");

const router = express.Router();

router.post("/", printJobController.createOrFetch);
router.post("/status", printJobController.updateStatus);

module.exports = router;
