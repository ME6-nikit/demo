const { v4: uuidv4 } = require("uuid");
const { Department, DepartmentStatus, PrintJobStatus } = require("../utils/constants");
const {
  createPrintJob,
  getNextPendingJob,
  getPrintJobById,
  updatePrintJobStatus,
} = require("../repositories/printJobRepository");
const {
  getPrinterForDepartment,
  getPrinterById,
} = require("../repositories/printerRepository");
const {
  upsertDepartmentStatus,
} = require("../repositories/orderDepartmentStatusRepository");
const { addTimelineEvent } = require("../repositories/orderTimelineRepository");
const { touchOrder } = require("../repositories/orderRepository");
const { nowSql } = require("../utils/time");

async function queuePrintJobsForOrder(orderId, statuses, pdfPaths) {
  const plannedDepartments = [
    { department: Department.DM, path: pdfPaths.dm_pdf_path },
    { department: Department.CONFECTIONERY, path: pdfPaths.confectionery_pdf_path },
    { department: Department.DESIGN, path: pdfPaths.design_pdf_path },
  ];

  for (const item of plannedDepartments) {
    const departmentStatus = statuses[item.department]?.status;
    if (departmentStatus === DepartmentStatus.NA) continue;

    const printer = await getPrinterForDepartment(item.department);
    if (!printer) {
      await upsertDepartmentStatus(
        orderId,
        item.department,
        DepartmentStatus.FAILURE,
        "No active online printer assigned"
      );
      await addTimelineEvent(
        orderId,
        "PRINT_VALIDATION",
        DepartmentStatus.FAILURE,
        `${item.department}: No active online printer assigned`
      );
      continue;
    }

    await createPrintJob({
      id: uuidv4(),
      order_id: orderId,
      department: item.department,
      pdf_path: item.path,
      printer_id: printer.printer_id,
      machine_id: printer.machine_id,
      status: PrintJobStatus.PENDING,
    });
    await addTimelineEvent(
      orderId,
      "PRINT_JOB_QUEUED",
      PrintJobStatus.PENDING,
      `${item.department}: Print job queued for printer ${printer.printer_name}`
    );
  }

  await touchOrder(orderId);
}

async function fetchNextPrintJob(machineId) {
  const job = await getNextPendingJob(machineId);
  if (!job) return null;
  await updatePrintJobStatus(job.id, PrintJobStatus.IN_PROGRESS);
  await upsertDepartmentStatus(
    job.order_id,
    job.department,
    DepartmentStatus.IN_PROGRESS,
    "Print job picked by desktop agent"
  );
  await addTimelineEvent(
    job.order_id,
    "PRINT_JOB_DISPATCHED",
    PrintJobStatus.IN_PROGRESS,
    `${job.department}: Desktop agent started print`
  );
  await touchOrder(job.order_id);
  return { ...job, status: PrintJobStatus.IN_PROGRESS };
}

async function updatePrintResult({ job_id: jobId, status, error_message: errorMessage }) {
  const job = await getPrintJobById(jobId);
  if (!job) return null;
  const normalized = status === "Success" ? PrintJobStatus.SUCCESS : PrintJobStatus.FAILURE;
  await updatePrintJobStatus(jobId, normalized, errorMessage || null);

  if (normalized === PrintJobStatus.SUCCESS) {
    await upsertDepartmentStatus(job.order_id, job.department, DepartmentStatus.SUCCESS, "Printed successfully");
    await addTimelineEvent(
      job.order_id,
      "PRINT_COMPLETED",
      DepartmentStatus.SUCCESS,
      `${job.department}: Printed successfully on ${job.printer_id}`
    );
  } else {
    await upsertDepartmentStatus(
      job.order_id,
      job.department,
      DepartmentStatus.FAILURE,
      errorMessage || "Desktop print failed"
    );
    await addTimelineEvent(
      job.order_id,
      "PRINT_FAILED",
      DepartmentStatus.FAILURE,
      `${job.department}: ${errorMessage || "Desktop print failed"}`
    );
  }
  await touchOrder(job.order_id);
  return getPrintJobById(jobId);
}

async function validatePrinter(printerId) {
  const printer = await getPrinterById(printerId);
  if (!printer) return { valid: false, reason: "Printer not found" };
  if (!printer.is_active) return { valid: false, reason: "Printer inactive" };
  if (printer.status !== "online") return { valid: false, reason: "Printer offline" };
  return { valid: true, printer };
}

module.exports = {
  queuePrintJobsForOrder,
  fetchNextPrintJob,
  updatePrintResult,
  validatePrinter,
  createManualPrintJob,
};

async function createManualPrintJob(payload) {
  const validation = await validatePrinter(payload.printer_id);
  if (!validation.valid) return { error: validation.reason };

  const job = {
    id: uuidv4(),
    order_id: String(payload.order_id),
    department: payload.department,
    pdf_path: payload.pdf_path,
    printer_id: payload.printer_id,
    machine_id: validation.printer.machine_id,
    status: PrintJobStatus.PENDING,
    created_at: nowSql(),
  };

  await createPrintJob(job);
  await upsertDepartmentStatus(
    job.order_id,
    job.department,
    DepartmentStatus.PENDING,
    "Manual print job queued"
  );
  await addTimelineEvent(
    job.order_id,
    "PRINT_JOB_QUEUED_MANUAL",
    PrintJobStatus.PENDING,
    `${job.department}: Manual print job queued for ${job.printer_id}`
  );
  await touchOrder(job.order_id);
  return job;
}
