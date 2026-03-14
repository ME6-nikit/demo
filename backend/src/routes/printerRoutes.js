const express = require("express");
const printerController = require("../controllers/printerController");

const router = express.Router();

router.post("/sync", printerController.sync);
router.post("/status", printerController.status);
router.get("/", printerController.list);
router.patch("/:printerId", printerController.configure);

module.exports = router;
