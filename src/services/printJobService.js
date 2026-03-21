const orderRepository = require("../repositories/orderRepository");
const printJobRepository = require("../repositories/printJobRepository");
const printerService = require("./printerService");
const timelineService = require("./timelineService");
const { statusColumnForDepartment, pdfColumnForDepartment } = require("../utils/departmentUtils");
const { DEPARTMENT_LIST } = require("../constants/departments");
const { DEPARTMENT_STATUS, PRINT_JOB_STATUS } = require("../constants/statuses");
const HttpError = require("../utils/httpError");

function getStatusForDepartment(orderRow, department) {
  const column = statusColumnForDepartment(department);
  return orderRow[column];
}

function getPdfForDepartment(orderRow, department) {
  const column = pdfColumnForDepartment(department);
  return orderRow[column];
}

async function createPrintJob(orderId, department, executor) {
  const order = await orderRepository.getOrderByInternalId(orderId, executor);
  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (order.is_ignored) {
    throw new HttpError(409, "Printing blocked: order is marked as ignored");
  }

  const currentStatus = getStatusForDepartment(order, department);
  if (currentStatus === DEPARTMENT_STATUS.NA) {
    throw new HttpError(409, `Department ${department} is not required for this order`);
  }

  const pdfPath = getPdfForDepartment(order, department);
  if (!pdfPath) {
    throw new HttpError(409, `PDF not available for department ${department}`);
  }

  const validation = await printerService.validatePrinterForDepartment(department, executor);
  if (!validation.valid) {
    await orderRepository.updateDepartmentStatus(order.id, statusColumnForDepartment(department), DEPARTMENT_STATUS.FAILED, executor);
    await timelineService.logTimelineEvent(
      {
        orderId: order.id,
        eventType: "PRINTER_VALIDATION_FAILED",
        status: "FAILED",
        department,
        message: validation.reason,
        metadata: validation.assignment || null,
      },
      executor
    );
    throw new HttpError(409, validation.reason);
  }

  const printJobId = await printJobRepository.createPrintJob(
    {
      orderId: order.id,
      department,
      printerId: validation.assignment.printer_id,
      machineId: validation.assignment.machine_id,
      pdfPath,
      jobStatus: PRINT_JOB_STATUS.PENDING,
    },
    executor
  );

  await orderRepository.updateDepartmentStatus(order.id, statusColumnForDepartment(department), DEPARTMENT_STATUS.IN_PROGRESS, executor);
  await timelineService.logTimelineEvent(
    {
      orderId: order.id,
      eventType: "PRINT_TRIGGERED",
      status: "SUCCESS",
      department,
      message: `Print job ${printJobId} queued for ${department}`,
      metadata: {
        printJobId,
        printerId: validation.assignment.printer_id,
        machineId: validation.assignment.machine_id,
      },
    },
    executor
  );

  return printJobId;
}

async function createJobsForEligibleDepartments(orderId, executor) {
  const order = await orderRepository.getOrderByInternalId(orderId, executor);
  if (!order || order.is_ignored) {
    return [];
  }

  const createdJobs = [];
  for (const department of DEPARTMENT_LIST) {
    const status = getStatusForDepartment(order, department);
    if (![DEPARTMENT_STATUS.PENDING, DEPARTMENT_STATUS.FAILED].includes(status)) {
      continue;
    }

    try {
      const jobId = await createPrintJob(order.id, department, executor);
      createdJobs.push({ department, jobId });
    } catch (error) {
      // The failure is already reflected in timeline/status by createPrintJob.
      createdJobs.push({ department, error: error.message });
    }
  }
  return createdJobs;
}

async function listPendingJobs(machineId, limit) {
  return printJobRepository.listPendingJobs(machineId, limit);
}

async function updatePrintJobStatus(jobId, status, message) {
  const normalizedStatus = String(status || "").toUpperCase();
  if (!Object.values(PRINT_JOB_STATUS).includes(normalizedStatus)) {
    throw new HttpError(400, "Invalid print job status");
  }

  const job = await printJobRepository.getPrintJobById(jobId);
  if (!job) {
    throw new HttpError(404, "Print job not found");
  }

  await printJobRepository.updatePrintJobStatus(jobId, normalizedStatus, message || null);

  const finalOrderStatus =
    normalizedStatus === PRINT_JOB_STATUS.SUCCESS
      ? DEPARTMENT_STATUS.SUCCESS
      : normalizedStatus === PRINT_JOB_STATUS.FAILED
        ? DEPARTMENT_STATUS.FAILED
        : normalizedStatus === PRINT_JOB_STATUS.CANCELLED
          ? DEPARTMENT_STATUS.PENDING
          : DEPARTMENT_STATUS.IN_PROGRESS;

  await orderRepository.updateDepartmentStatus(job.order_id, statusColumnForDepartment(job.department), finalOrderStatus);
  await timelineService.logTimelineEvent({
    orderId: job.order_id,
    eventType: "PRINT_RESULT",
    status: normalizedStatus,
    department: job.department,
    message: message || `Print job ${job.id} updated to ${normalizedStatus}`,
    metadata: {
      printJobId: job.id,
      printerId: job.printer_id,
      machineId: job.machine_id,
    },
  });
}

module.exports = {
  createPrintJob,
  createJobsForEligibleDepartments,
  listPendingJobs,
  updatePrintJobStatus,
};
