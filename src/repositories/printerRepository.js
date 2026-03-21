const { pool } = require("../db/pool");

function getExecutor(executor) {
  return executor || pool;
}

async function upsertPrinter(printer, executor) {
  const db = getExecutor(executor);
  const {
    printerId,
    printerName,
    machineId,
    status = "UNKNOWN",
    isActive = true,
    metadata = null,
    lastSeenAt = null,
  } = printer;

  await db.query(
    `
      INSERT INTO printers (
        printer_id,
        printer_name,
        machine_id,
        status,
        is_active,
        metadata,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        printer_name = VALUES(printer_name),
        status = VALUES(status),
        is_active = VALUES(is_active),
        metadata = VALUES(metadata),
        last_seen_at = VALUES(last_seen_at)
    `,
    [printerId, printerName, machineId, status, isActive ? 1 : 0, metadata ? JSON.stringify(metadata) : null, lastSeenAt]
  );
}

async function updatePrinterStatus(payload, executor) {
  const db = getExecutor(executor);
  const { printerId, machineId, status, isActive, metadata } = payload;
  await db.query(
    `
      UPDATE printers
      SET
        status = COALESCE(?, status),
        is_active = COALESCE(?, is_active),
        metadata = COALESCE(?, metadata),
        last_seen_at = NOW()
      WHERE printer_id = ? AND machine_id = ?
    `,
    [status || null, isActive === undefined ? null : Number(Boolean(isActive)), metadata ? JSON.stringify(metadata) : null, printerId, machineId]
  );
}

async function listPrinters(executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        p.*,
        dpa.department AS assigned_department
      FROM printers p
      LEFT JOIN department_printer_assignments dpa
        ON dpa.printer_id = p.printer_id AND dpa.machine_id = p.machine_id
      ORDER BY p.machine_id ASC, p.printer_name ASC
    `
  );
  return rows;
}

async function assignPrinterToDepartment({ department, printerId, machineId }, executor) {
  const db = getExecutor(executor);
  await db.query(
    `
      INSERT INTO department_printer_assignments (department, printer_id, machine_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        printer_id = VALUES(printer_id),
        machine_id = VALUES(machine_id)
    `,
    [department, printerId, machineId]
  );
}

async function getPrinterAssignmentByDepartment(department, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        dpa.department,
        dpa.printer_id,
        dpa.machine_id,
        p.printer_name,
        p.status,
        p.is_active
      FROM department_printer_assignments dpa
      LEFT JOIN printers p
        ON p.printer_id = dpa.printer_id AND p.machine_id = dpa.machine_id
      WHERE dpa.department = ?
      LIMIT 1
    `,
    [department]
  );
  return rows[0] || null;
}

async function listAssignments(executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        dpa.department,
        dpa.printer_id,
        dpa.machine_id,
        p.printer_name,
        p.status,
        p.is_active,
        dpa.updated_at
      FROM department_printer_assignments dpa
      LEFT JOIN printers p
        ON p.printer_id = dpa.printer_id AND p.machine_id = dpa.machine_id
      ORDER BY dpa.department
    `
  );
  return rows;
}

module.exports = {
  upsertPrinter,
  updatePrinterStatus,
  listPrinters,
  assignPrinterToDepartment,
  getPrinterAssignmentByDepartment,
  listAssignments,
};
