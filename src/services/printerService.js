const printerRepository = require("../repositories/printerRepository");
const { normalizeDepartment } = require("../utils/departmentUtils");
const HttpError = require("../utils/httpError");

async function syncPrinters(machineId, printers = []) {
  if (!machineId) {
    throw new HttpError(400, "machineId is required");
  }

  for (const printer of printers) {
    if (!printer.printerId || !printer.printerName) {
      throw new HttpError(400, "Each printer must include printerId and printerName");
    }

    await printerRepository.upsertPrinter({
      printerId: printer.printerId,
      printerName: printer.printerName,
      machineId,
      status: printer.status || "ONLINE",
      isActive: printer.isActive !== false,
      metadata: printer.metadata || null,
      lastSeenAt: new Date(),
    });
  }
}

async function updatePrinterStatus(payload) {
  const { printerId, machineId } = payload;
  if (!printerId || !machineId) {
    throw new HttpError(400, "printerId and machineId are required");
  }
  await printerRepository.updatePrinterStatus(payload);
}

async function assignPrinterToDepartment(department, printerId, machineId) {
  const normalized = normalizeDepartment(department);
  if (!normalized) {
    throw new HttpError(400, "Invalid department");
  }
  if (!printerId || !machineId) {
    throw new HttpError(400, "printerId and machineId are required");
  }

  await printerRepository.assignPrinterToDepartment({
    department: normalized,
    printerId,
    machineId,
  });
}

async function validatePrinterForDepartment(department, executor) {
  const assignment = await printerRepository.getPrinterAssignmentByDepartment(department, executor);
  if (!assignment) {
    return {
      valid: false,
      reason: `No printer assigned to department ${department}`,
    };
  }

  if (!assignment.printer_name) {
    return {
      valid: false,
      reason: `Assigned printer not found for department ${department}`,
    };
  }

  if (!assignment.is_active) {
    return {
      valid: false,
      reason: `Printer ${assignment.printer_id} is inactive`,
      assignment,
    };
  }

  const printerStatus = String(assignment.status || "").toUpperCase();
  if (printerStatus !== "ONLINE") {
    return {
      valid: false,
      reason: `Printer ${assignment.printer_id} is not online (status: ${assignment.status})`,
      assignment,
    };
  }

  return {
    valid: true,
    assignment,
  };
}

async function listPrinters() {
  return printerRepository.listPrinters();
}

async function listPrinterAssignments() {
  return printerRepository.listAssignments();
}

module.exports = {
  syncPrinters,
  updatePrinterStatus,
  assignPrinterToDepartment,
  validatePrinterForDepartment,
  listPrinters,
  listPrinterAssignments,
};
