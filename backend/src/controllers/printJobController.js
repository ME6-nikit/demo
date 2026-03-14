const {
  createManualPrintJob,
  fetchNextPrintJob,
  updatePrintResult,
} = require("../services/printJobService");

async function createOrFetch(req, res, next) {
  try {
    const payload = req.body || {};

    if (payload.order_id && payload.department && payload.printer_id && payload.pdf_path) {
      const created = await createManualPrintJob(payload);
      if (created.error) return res.status(400).json(created);
      return res.status(201).json({ job: created });
    }

    if (!payload.machine_id) {
      return res
        .status(400)
        .json({ message: "machine_id is required to fetch queued print jobs" });
    }
    const job = await fetchNextPrintJob(payload.machine_id);
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { job_id, status, error_message } = req.body || {};
    if (!job_id || !status) {
      return res.status(400).json({ message: "job_id and status are required" });
    }
    const job = await updatePrintResult({ job_id, status, error_message });
    if (!job) return res.status(404).json({ message: "Print job not found" });
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrFetch,
  updateStatus,
};
