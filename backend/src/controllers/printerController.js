const {
  syncPrinters,
  updateStatuses,
  configurePrinter,
  getAllPrinters,
} = require("../services/printerService");

async function sync(req, res, next) {
  try {
    const { machine_id: machineId, printers = [] } = req.body;
    if (!machineId || !Array.isArray(printers)) {
      return res.status(400).json({ message: "machine_id and printers are required" });
    }
    const data = await syncPrinters(machineId, printers);
    return res.json({ printers: data });
  } catch (error) {
    return next(error);
  }
}

async function status(req, res, next) {
  try {
    const { statuses = [] } = req.body;
    if (!Array.isArray(statuses)) {
      return res.status(400).json({ message: "statuses must be an array" });
    }
    const data = await updateStatuses(statuses);
    return res.json({ printers: data });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const data = await getAllPrinters();
    return res.json({ printers: data });
  } catch (error) {
    return next(error);
  }
}

async function configure(req, res, next) {
  try {
    const printer = await configurePrinter(req.params.printerId, req.body || {});
    if (!printer) return res.status(404).json({ message: "Printer not found" });
    return res.json({ printer });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sync,
  status,
  list,
  configure,
};
