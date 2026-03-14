const { all, get, run } = require("../models/db");
const { nowSql } = require("../utils/time");

async function createPrintJob(job) {
  await run(
    `
      INSERT INTO print_jobs(
        id, order_id, department, pdf_path, printer_id, machine_id, status, error_message, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      job.id,
      job.order_id,
      job.department,
      job.pdf_path,
      job.printer_id,
      job.machine_id,
      job.status,
      job.error_message || null,
      nowSql(),
      nowSql(),
    ]
  );
}

async function getNextPendingJob(machineId) {
  const jobs = await all(
    `
      SELECT * FROM print_jobs
      WHERE machine_id = ? AND status = 'Pending'
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [machineId]
  );
  return jobs[0] || null;
}

async function updatePrintJobStatus(jobId, status, errorMessage = null) {
  await run(
    `
      UPDATE print_jobs
      SET status = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `,
    [status, errorMessage, nowSql(), jobId]
  );
}

function getPrintJobById(jobId) {
  return get("SELECT * FROM print_jobs WHERE id = ?", [jobId]);
}

module.exports = {
  createPrintJob,
  getNextPendingJob,
  updatePrintJobStatus,
  getPrintJobById,
};
