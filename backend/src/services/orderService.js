const fs = require("fs");
const { Department, DepartmentStatus } = require("../utils/constants");
const { evaluateOrderRules } = require("./ruleEngineService");
const { generateDepartmentPdfs } = require("./pdfService");
const { queuePrintJobsForOrder } = require("./printJobService");
const { upsertOrder, getOrderByOrderId, listOrders, setIgnored } = require("../repositories/orderRepository");
const {
  setDepartmentStatuses,
  getDepartmentStatuses,
  getDepartmentStatusesForOrders,
} = require("../repositories/orderDepartmentStatusRepository");
const { upsertOrderPdfPaths, getOrderPdfPaths, getOrderPdfPathsForOrders } = require("../repositories/orderPdfRepository");
const { addTimelineEvent, listTimeline } = require("../repositories/orderTimelineRepository");

function normalizeShopifyOrder(payload) {
  const customerName = payload.customer
    ? [payload.customer.first_name, payload.customer.last_name].filter(Boolean).join(" ").trim()
    : payload.shipping_address?.name || "";
  const noteAttributes = payload.note_attributes || [];
  const deliveryDate = noteAttributes.find((a) => (a.name || "").toLowerCase().includes("delivery date"))?.value;
  const deliveryTime = noteAttributes.find((a) => (a.name || "").toLowerCase().includes("delivery time"))?.value;

  return {
    order_id: String(payload.id),
    order_number: String(payload.order_number || payload.name || payload.id),
    customer_name: customerName || "Unknown",
    delivery_date: deliveryDate || payload.delivery_date || null,
    delivery_time: deliveryTime || payload.delivery_time || null,
    shipping_method: payload.shipping_lines?.[0]?.title || null,
    items: payload.line_items || [],
    tags: (payload.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    is_draft: Boolean(payload.source_name === "shopify_draft_order" || payload.draft_order_id),
  };
}

function rowToStatusMap(rows) {
  return rows.reduce((acc, row) => {
    acc[row.department] = {
      status: row.status,
      message: row.last_message,
      updated_at: row.updated_at,
    };
    return acc;
  }, {});
}

function normalizeOrderView(order, statusRows, pdfRow) {
  const statusMap = rowToStatusMap(statusRows);
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    delivery_date: order.delivery_date,
    delivery_time: order.delivery_time,
    shipping_method: order.shipping_method,
    tags: order.tags,
    ignored: order.ignored,
    updated_at: order.updated_at,
    dm_status: statusMap[Department.DM]?.status || DepartmentStatus.PENDING,
    confectionery_status:
      statusMap[Department.CONFECTIONERY]?.status || DepartmentStatus.PENDING,
    design_status: statusMap[Department.DESIGN]?.status || DepartmentStatus.PENDING,
    dm_pdf_path: pdfRow?.dm_pdf_path || null,
    confectionery_pdf_path: pdfRow?.confectionery_pdf_path || null,
    design_pdf_path: pdfRow?.design_pdf_path || null,
  };
}

async function processShopifyOrder(webhookPayload) {
  const order = normalizeShopifyOrder(webhookPayload);
  await upsertOrder(order);
  await addTimelineEvent(order.order_id, "ORDER_RECEIVED", "Success", "Shopify webhook received");

  const ruleResult = evaluateOrderRules(order);
  await setDepartmentStatuses(order.order_id, ruleResult.statuses);
  await addTimelineEvent(
    order.order_id,
    "RULE_EVALUATED",
    "Success",
    ruleResult.reasons.join(" | ")
  );

  const pdfPaths = await generateDepartmentPdfs(order, ruleResult.statuses);
  await upsertOrderPdfPaths(order.order_id, pdfPaths);
  await addTimelineEvent(
    order.order_id,
    "PDF_GENERATED",
    "Success",
    "Department PDFs generated and stored"
  );

  await queuePrintJobsForOrder(order.order_id, ruleResult.statuses, pdfPaths);
  await addTimelineEvent(order.order_id, "PRINT_FLOW_STARTED", "In-Progress", "Print queue evaluation completed");

  return getOrderDetails(order.order_id);
}

async function getOrderDetails(orderId) {
  const order = await getOrderByOrderId(orderId);
  if (!order) return null;
  const [statuses, pdfs] = await Promise.all([
    getDepartmentStatuses(orderId),
    getOrderPdfPaths(orderId),
  ]);
  return normalizeOrderView(order, statuses, pdfs);
}

async function listOrdersView({ actionRequired }) {
  const orders = await listOrders({ actionRequired });
  const orderIds = orders.map((o) => o.order_id);
  const [allStatuses, allPdfs] = await Promise.all([
    getDepartmentStatusesForOrders(orderIds),
    getOrderPdfPathsForOrders(orderIds),
  ]);

  const statusByOrder = allStatuses.reduce((acc, row) => {
    if (!acc[row.order_id]) acc[row.order_id] = [];
    acc[row.order_id].push(row);
    return acc;
  }, {});
  const pdfByOrder = allPdfs.reduce((acc, row) => {
    acc[row.order_id] = row;
    return acc;
  }, {});

  return orders.map((order) =>
    normalizeOrderView(order, statusByOrder[order.order_id] || [], pdfByOrder[order.order_id])
  );
}

function departmentToField(department) {
  const normalized = String(department || "").toLowerCase();
  if (normalized === "dm") return { field: "dm_pdf_path", department: Department.DM };
  if (normalized === "confectionery")
    return { field: "confectionery_pdf_path", department: Department.CONFECTIONERY };
  if (normalized === "design") return { field: "design_pdf_path", department: Department.DESIGN };
  return null;
}

async function resolveDepartmentPdf(orderId, department) {
  const mapping = departmentToField(department);
  if (!mapping) return null;
  const [pdfs, statuses] = await Promise.all([
    getOrderPdfPaths(orderId),
    getDepartmentStatuses(orderId),
  ]);
  if (!pdfs) return null;
  const statusMap = rowToStatusMap(statuses);
  if (statusMap[mapping.department]?.status === DepartmentStatus.NA) {
    return { disabled: true, reason: "Department is NA" };
  }
  const path = pdfs[mapping.field];
  if (!path || !fs.existsSync(path)) return null;
  return { disabled: false, path };
}

async function ignoreOrder(orderId, ignored) {
  await setIgnored(orderId, ignored);
  await addTimelineEvent(orderId, "ORDER_IGNORE_UPDATED", "Success", `Order ignored set to ${ignored}`);
}

async function getOrderTimeline(orderId) {
  return listTimeline(orderId);
}

module.exports = {
  processShopifyOrder,
  getOrderDetails,
  listOrdersView,
  resolveDepartmentPdf,
  ignoreOrder,
  getOrderTimeline,
};
