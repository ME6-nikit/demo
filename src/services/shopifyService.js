const env = require("../config/env");
const { withTransaction } = require("../db/pool");
const orderRepository = require("../repositories/orderRepository");
const printJobRepository = require("../repositories/printJobRepository");
const timelineService = require("./timelineService");
const { mapShopifyOrderPayload } = require("../utils/shopifyOrderMapper");
const { evaluateOrderRules } = require("./ruleEngineService");
const { DEPARTMENT_LIST, DEPARTMENTS } = require("../constants/departments");
const { DEPARTMENT_STATUS } = require("../constants/statuses");
const { generateDepartmentPdf } = require("./pdfService");
const printJobService = require("./printJobService");
const HttpError = require("../utils/httpError");

function statusMapFromRequiredDepartments(requiredDepartments) {
  return {
    dm: requiredDepartments.includes(DEPARTMENTS.DM) ? DEPARTMENT_STATUS.PENDING : DEPARTMENT_STATUS.NA,
    confectionery: requiredDepartments.includes(DEPARTMENTS.CONFECTIONERY)
      ? DEPARTMENT_STATUS.PENDING
      : DEPARTMENT_STATUS.NA,
    design: requiredDepartments.includes(DEPARTMENTS.DESIGN) ? DEPARTMENT_STATUS.PENDING : DEPARTMENT_STATUS.NA,
  };
}

function emptyPdfMap() {
  return {
    dm: null,
    confectionery: null,
    design: null,
  };
}

function assignPdfPath(pdfMap, department, relativePath) {
  if (department === DEPARTMENTS.DM) {
    pdfMap.dm = relativePath;
  }
  if (department === DEPARTMENTS.CONFECTIONERY) {
    pdfMap.confectionery = relativePath;
  }
  if (department === DEPARTMENTS.DESIGN) {
    pdfMap.design = relativePath;
  }
}

async function processOrderWebhook(payload) {
  return processOrderWebhookWithOptions(payload, {});
}

async function processOrderWebhookWithOptions(payload, options) {
  const normalizedOrder = mapShopifyOrderPayload(payload);
  if (!normalizedOrder.shopifyOrderId || !normalizedOrder.orderNumber) {
    throw new HttpError(400, "Invalid Shopify order payload");
  }

  return withTransaction(async (connection) => {
    const persistedOrder = await orderRepository.upsertOrderFromShopify(normalizedOrder, connection);
    await orderRepository.ensureOrderSubrecords(persistedOrder.id, connection);

    await timelineService.logTimelineEvent(
      {
        orderId: persistedOrder.id,
        eventType: "WEBHOOK_RECEIVED",
        status: "SUCCESS",
        message: `Order webhook received for Shopify order ${normalizedOrder.shopifyOrderId}`,
      },
      connection
    );

    const ruleResult = evaluateOrderRules(payload, normalizedOrder);
    const requiredDepartments = [...new Set(ruleResult.requiredDepartments)].filter((department) =>
      DEPARTMENT_LIST.includes(department)
    );
    const statusMap = statusMapFromRequiredDepartments(requiredDepartments);

    await orderRepository.updateDepartmentStatuses(persistedOrder.id, statusMap, connection);
    await timelineService.logTimelineEvent(
      {
        orderId: persistedOrder.id,
        eventType: "RULES_EVALUATED",
        status: "SUCCESS",
        message: `Rule engine evaluated order: ${ruleResult.reason}`,
        metadata: {
          requiredDepartments,
          flags: ruleResult.flags,
        },
      },
      connection
    );

    const freshOrder = await orderRepository.getOrderByInternalId(persistedOrder.id, connection);
    const pdfMap = emptyPdfMap();
    for (const department of requiredDepartments) {
      const generated = await generateDepartmentPdf(freshOrder, department);
      assignPdfPath(pdfMap, department, generated.relativePath);
      await timelineService.logTimelineEvent(
        {
          orderId: persistedOrder.id,
          eventType: "PDF_GENERATED",
          status: "SUCCESS",
          department,
          message: `PDF generated for ${department}`,
          metadata: {
            pdfPath: generated.relativePath,
          },
        },
        connection
      );
    }
    await orderRepository.updatePdfPaths(persistedOrder.id, pdfMap, connection);

    if (freshOrder.is_ignored) {
      await timelineService.logTimelineEvent(
        {
          orderId: persistedOrder.id,
          eventType: "PRINT_BLOCKED",
          status: "SUCCESS",
          message: "Order is ignored; print job creation skipped",
        },
        connection
      );
      return persistedOrder.id;
    }

    if (env.autoTriggerPrintJobs || options.forceTriggerPrintJobs) {
      await printJobService.createJobsForEligibleDepartments(persistedOrder.id, connection);
    }

    return persistedOrder.id;
  });
}

function toShopifyLikeTestPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Request payload must be a JSON object");
  }

  const normalized = {
    ...payload,
  };

  if (!normalized.id && normalized.order_id) {
    normalized.id = normalized.order_id;
  }
  if (!normalized.order_number && normalized.name) {
    normalized.order_number = normalized.name;
  }
  if (!normalized.created_at) {
    normalized.created_at = new Date().toISOString();
  }
  if (!Array.isArray(normalized.line_items)) {
    normalized.line_items = [];
  }

  if (!normalized.customer && normalized.customer_name) {
    const nameParts = String(normalized.customer_name).trim().split(/\s+/);
    normalized.customer = {
      first_name: nameParts.shift() || "Sample",
      last_name: nameParts.join(" ") || "Customer",
    };
  }

  if (!Array.isArray(normalized.note_attributes)) {
    normalized.note_attributes = [];
  }

  const noteAttributePairs = [
    ["delivery_date", normalized.delivery_date],
    ["delivery_time", normalized.delivery_time],
    ["specific_delivery_time", normalized.specific_delivery_time],
    ["reserved", normalized.reserved !== undefined ? String(Boolean(normalized.reserved)) : undefined],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  for (const [name, value] of noteAttributePairs) {
    const existing = normalized.note_attributes.find((item) => item?.name === name || item?.key === name);
    if (!existing) {
      normalized.note_attributes.push({
        name,
        value: String(value),
      });
    }
  }

  if (!Array.isArray(normalized.shipping_lines) || normalized.shipping_lines.length === 0) {
    if (normalized.shipping_method || normalized.shipping_code) {
      normalized.shipping_lines = [
        {
          title: normalized.shipping_method || normalized.shipping_code,
          code: normalized.shipping_code || normalized.shipping_method,
        },
      ];
    } else {
      normalized.shipping_lines = [];
    }
  }

  if (!normalized.id || !normalized.order_number) {
    throw new HttpError(400, "Test payload requires id/order_id and order_number/name");
  }

  return normalized;
}

function requiredDepartmentsFromOrder(orderRow) {
  const required = [];
  if (orderRow.dm_status !== DEPARTMENT_STATUS.NA) {
    required.push(DEPARTMENTS.DM);
  }
  if (orderRow.confectionery_status !== DEPARTMENT_STATUS.NA) {
    required.push(DEPARTMENTS.CONFECTIONERY);
  }
  if (orderRow.design_status !== DEPARTMENT_STATUS.NA) {
    required.push(DEPARTMENTS.DESIGN);
  }
  return required;
}

async function processTestOrderWebhook(payload) {
  const normalizedPayload = toShopifyLikeTestPayload(payload);
  const internalOrderId = await processOrderWebhookWithOptions(normalizedPayload, {
    forceTriggerPrintJobs: true,
  });

  const order = await orderRepository.getOrderByInternalId(internalOrderId);
  const printJobs = await printJobRepository.listJobsByOrderId(internalOrderId);

  return {
    internalOrderId,
    shopifyOrderId: order.order_id,
    orderNumber: order.order_number,
    requiredDepartments: requiredDepartmentsFromOrder(order),
    pdfPaths: {
      dm: order.dm_pdf_path,
      confectionery: order.confectionery_pdf_path,
      design: order.design_pdf_path,
    },
    printJobs: printJobs.map((job) => ({
      id: job.id,
      department: job.department,
      status: job.job_status,
      printerId: job.printer_id,
      machineId: job.machine_id,
      pdfPath: job.pdf_path,
      errorMessage: job.error_message,
    })),
  };
}

async function processSampleOrderWebhook(payload) {
  return processTestOrderWebhook(payload);
}

module.exports = {
  processOrderWebhook,
  processTestOrderWebhook,
  processSampleOrderWebhook,
};
