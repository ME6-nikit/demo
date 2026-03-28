const printJobService = require("../services/printJobService");
const orderService = require("../services/orderService");
const { normalizeDepartment } = require("../utils/departmentUtils");
const HttpError = require("../utils/httpError");

async function createPrintJob(req, res, next) {
  try {
    const { orderId, department } = req.body || {};
    if (!orderId || !department) {
      throw new HttpError(400, "orderId and department are required");
    }

    const normalizedDepartment = normalizeDepartment(department);
    if (!normalizedDepartment) {
      throw new HttpError(400, "Invalid department");
    }

    const order = await orderService.getOrderById(orderId);
    const jobId = await printJobService.createPrintJob(order.id, normalizedDepartment);
    res.status(201).json({
      message: "Print job created",
      jobId,
    });
  } catch (error) {
    next(error);
  }
}

async function listPendingJobs(req, res, next) {
  try {
    const machineId = req.query.machineId || null;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const jobs = await printJobService.listPendingJobs(machineId, limit);
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

async function updatePrintJobStatus(req, res, next) {
  try {
    const { status, message } = req.body || {};
    if (!status) {
      throw new HttpError(400, "status is required");
    }
    await printJobService.updatePrintJobStatus(req.params.jobId, status, message);
    res.json({ message: "Print job status updated" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPrintJob,
  listPendingJobs,
  updatePrintJobStatus,
};
