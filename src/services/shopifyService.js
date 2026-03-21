const env = require("../config/env");
const { withTransaction } = require("../db/pool");
const orderRepository = require("../repositories/orderRepository");
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

    if (env.autoTriggerPrintJobs) {
      await printJobService.createJobsForEligibleDepartments(persistedOrder.id, connection);
    }

    return persistedOrder.id;
  });
}

function mapSampleWebhookPayload(payload) {
  const shopifyOrderId = payload.order_id || payload.id;
  const orderNumber = payload.order_number || payload.name;

  if (!shopifyOrderId || !orderNumber) {
    throw new HttpError(400, "Sample payload requires order_id (or id) and order_number (or name)");
  }

  const customerName =
    payload.customer_name ||
    [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(" ").trim() ||
    "Sample Customer";

  return {
    shopifyOrderId: String(shopifyOrderId),
    orderNumber: String(orderNumber),
    customerName,
    orderDate: payload.order_date ? new Date(payload.order_date) : new Date(),
    deliveryDate: payload.delivery_date || null,
    deliveryTime: payload.delivery_time || null,
    specificDeliveryTime: payload.specific_delivery_time || null,
    shippingMethod: payload.shipping_method || null,
    reserved: Boolean(payload.reserved),
    rawPayload: payload,
  };
}

async function processSampleOrderWebhook(payload) {
  const normalizedOrder = mapSampleWebhookPayload(payload);
  const allPendingStatusMap = {
    dm: DEPARTMENT_STATUS.PENDING,
    confectionery: DEPARTMENT_STATUS.PENDING,
    design: DEPARTMENT_STATUS.PENDING,
  };

  return withTransaction(async (connection) => {
    const persistedOrder = await orderRepository.upsertOrderFromShopify(normalizedOrder, connection);
    await orderRepository.ensureOrderSubrecords(persistedOrder.id, connection);
    await orderRepository.updateDepartmentStatuses(persistedOrder.id, allPendingStatusMap, connection);

    await timelineService.logTimelineEvent(
      {
        orderId: persistedOrder.id,
        eventType: "WEBHOOK_RECEIVED",
        status: "SUCCESS",
        message: `Sample webhook received for order ${normalizedOrder.orderNumber}`,
        metadata: {
          sampleWebhook: true,
          shopifyOrderId: normalizedOrder.shopifyOrderId,
        },
      },
      connection
    );

    await timelineService.logTimelineEvent(
      {
        orderId: persistedOrder.id,
        eventType: "RULES_EVALUATED",
        status: "SUCCESS",
        message: "Sample webhook defaulted all departments to PENDING",
        metadata: {
          sampleWebhook: true,
          requiredDepartments: [...DEPARTMENT_LIST],
        },
      },
      connection
    );

    return {
      internalOrderId: persistedOrder.id,
      shopifyOrderId: normalizedOrder.shopifyOrderId,
      orderNumber: normalizedOrder.orderNumber,
    };
  });
}

module.exports = {
  processOrderWebhook,
  processSampleOrderWebhook,
};
