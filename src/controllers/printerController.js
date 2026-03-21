const printerService = require("../services/printerService");
const HttpError = require("../utils/httpError");

async function syncPrinters(req, res, next) {
  try {
    const { machineId, printers } = req.body || {};
    if (!Array.isArray(printers)) {
      throw new HttpError(400, "printers must be an array");
    }

    await printerService.syncPrinters(machineId, printers);
    res.json({ message: "Printers synced successfully" });
  } catch (error) {
    next(error);
  }
}

async function updatePrinterStatus(req, res, next) {
  try {
    await printerService.updatePrinterStatus(req.body || {});
    res.json({ message: "Printer status updated" });
  } catch (error) {
    next(error);
  }
}

async function assignPrinter(req, res, next) {
  try {
    const { department, printerId, machineId } = req.body || {};
    await printerService.assignPrinterToDepartment(department, printerId, machineId);
    res.json({ message: "Printer assigned to department" });
  } catch (error) {
    next(error);
  }
}

async function listPrinters(req, res, next) {
  try {
    const printers = await printerService.listPrinters();
    res.json({ printers });
  } catch (error) {
    next(error);
  }
}

async function listAssignments(req, res, next) {
  try {
    const assignments = await printerService.listPrinterAssignments();
    res.json({ assignments });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  syncPrinters,
  updatePrinterStatus,
  assignPrinter,
  listPrinters,
  listAssignments,
};
