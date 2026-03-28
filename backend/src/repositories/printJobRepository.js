const { pool } = require("../db/pool");

function getExecutor(executor) {
  return executor || pool;
}

async function createPrintJob(payload, executor) {
  const db = getExecutor(executor);
  const { orderId, department, printerId, machineId, pdfPath, jobStatus = "PENDING" } = payload;
  const [result] = await db.query(
    `
      INSERT INTO print_jobs (
        order_id,
        department,
        printer_id,
        machine_id,
        pdf_path,
        job_status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [orderId, department, printerId, machineId, pdfPath, jobStatus]
  );
  return result.insertId;
}

async function listPendingJobs(machineId, limit = 50, executor) {
  const db = getExecutor(executor);
  const params = [];
  let machineClause = "";
  if (machineId) {
    machineClause = "AND pj.machine_id = ?";
    params.push(machineId);
  }

  const [rows] = await db.query(
    `
      SELECT
        pj.*,
        o.order_number,
        o.order_id AS shopify_order_id
      FROM print_jobs pj
      JOIN orders o ON o.id = pj.order_id
      WHERE pj.job_status = 'PENDING'
      ${machineClause}
      ORDER BY pj.requested_at ASC
      LIMIT ?
    `,
    [...params, Number(limit)]
  );
  return rows;
}

async function getPrintJobById(jobId, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query("SELECT * FROM print_jobs WHERE id = ? LIMIT 1", [jobId]);
  return rows[0] || null;
}

async function updatePrintJobStatus(jobId, status, errorMessage, executor) {
  const db = getExecutor(executor);
  const completedAt = status === "SUCCESS" || status === "FAILED" || status === "CANCELLED" ? new Date() : null;
  await db.query(
    `
      UPDATE print_jobs
      SET
        job_status = ?,
        error_message = ?,
        completed_at = COALESCE(?, completed_at)
      WHERE id = ?
    `,
    [status, errorMessage || null, completedAt, jobId]
  );
}

async function cancelPendingJobsForOrder(orderId, executor) {
  const db = getExecutor(executor);
  await db.query(
    `
      UPDATE print_jobs
      SET job_status = 'CANCELLED', completed_at = NOW(), error_message = 'Order marked as ignored'
      WHERE order_id = ? AND job_status IN ('PENDING', 'IN-PROGRESS')
    `,
    [orderId]
  );
}

module.exports = {
  createPrintJob,
  listPendingJobs,
  getPrintJobById,
  updatePrintJobStatus,
  cancelPendingJobsForOrder,
};
