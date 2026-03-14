const {
  getPrinters,
  upsertPrinter,
  updatePrinterConfig,
  updatePrinterStatus,
  getPrinterById,
} = require("../repositories/printerRepository");

async function syncPrinters(machineId, printers) {
  for (const printer of printers) {
    await upsertPrinter({
      printer_id: printer.printer_id,
      printer_name: printer.printer_name,
      machine_id: machineId,
      status: (printer.status || "offline").toLowerCase(),
    });
  }
  return getPrinters();
}

async function updateStatuses(statuses) {
  for (const statusItem of statuses) {
    await updatePrinterStatus(statusItem.printer_id, {
      status: (statusItem.status || "offline").toLowerCase(),
    });
  }
  return getPrinters();
}

async function configurePrinter(printerId, payload) {
  return updatePrinterConfig(printerId, payload);
}

async function getAllPrinters() {
  return getPrinters();
}

async function getPrinter(printerId) {
  return getPrinterById(printerId);
}

module.exports = {
  syncPrinters,
  updateStatuses,
  configurePrinter,
  getAllPrinters,
  getPrinter,
};
