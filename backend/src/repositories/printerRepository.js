const { all, get, run } = require("../models/db");
const { nowSql } = require("../utils/time");

async function upsertPrinter(printer) {
  const ts = nowSql();
  await run(
    `
      INSERT INTO printers(
        printer_id, printer_name, machine_id, status, is_active, assigned_department, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 1, NULL, ?, ?)
      ON DUPLICATE KEY UPDATE
        printer_name = VALUES(printer_name),
        machine_id = VALUES(machine_id),
        status = VALUES(status),
        updated_at = VALUES(updated_at)
    `,
    [
      printer.printer_id,
      printer.printer_name,
      printer.machine_id,
      printer.status || "offline",
      ts,
      ts,
    ]
  );
}

async function updatePrinterStatus(printerId, status) {
  await run(
    `
      UPDATE printers
      SET status = ?, updated_at = ?
      WHERE printer_id = ?
    `,
    [status.status || "offline", nowSql(), printerId]
  );
}

async function updatePrinterConfig(printerId, payload) {
  const existing = await get("SELECT * FROM printers WHERE printer_id = ?", [printerId]);
  if (!existing) return null;

  await run(
    `
      UPDATE printers
      SET is_active = ?, assigned_department = ?, updated_at = ?
      WHERE printer_id = ?
    `,
    [
      payload.is_active === undefined ? existing.is_active : payload.is_active ? 1 : 0,
      payload.assigned_department === undefined
        ? existing.assigned_department
        : payload.assigned_department,
      nowSql(),
      printerId,
    ]
  );

  return get("SELECT * FROM printers WHERE printer_id = ?", [printerId]);
}

function getPrinters() {
  return all("SELECT * FROM printers ORDER BY updated_at DESC");
}

function getPrinterForDepartment(department) {
  return get(
    `
      SELECT * FROM printers
      WHERE assigned_department = ? AND is_active = 1
        AND status = 'online'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [department]
  );
}

function getPrinterById(printerId) {
  return get("SELECT * FROM printers WHERE printer_id = ?", [printerId]);
}

module.exports = {
  upsertPrinter,
  updatePrinterStatus,
  updatePrinterConfig,
  getPrinters,
  getPrinterForDepartment,
  getPrinterById,
};
