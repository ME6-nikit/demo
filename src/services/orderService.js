const path = require("path");
const fs = require("fs/promises");
const { withTransaction } = require("../db/pool");
const orderRepository = require("../repositories/orderRepository");
const printJobRepository = require("../repositories/printJobRepository");
const timelineService = require("./timelineService");
const { presentOrder } = require("../utils/orderPresenter");
const { normalizeDepartment, pdfColumnForDepartment } = require("../utils/departmentUtils");
const HttpError = require("../utils/httpError");
const printJobService = require("./printJobService");
const { DEPARTMENT_STATUS } = require("../constants/statuses");

function parsePagination(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  return {
    limit,
    page,
    offset: (page - 1) * limit,
  };
}

async function listOrders(query) {
  const view = String(query.view || "action_required").toLowerCase() === "all" ? "all" : "action_required";
  const pagination = parsePagination(query);

  const result = await orderRepository.listOrders(
    {
      view,
      orderNo: query.orderNo,
      orderDate: query.orderDate,
      deliveryDate: query.deliveryDate,
      deliverySlot: query.deliverySlot,
    },
    pagination
  );

  return {
    view,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / pagination.limit) || 1,
    },
    orders: result.rows.map(presentOrder),
  };
}

async function getOrderOrThrow(identifier) {
  const order = await orderRepository.getOrderByIdentifier(identifier);
  if (!order) {
    throw new HttpError(404, "Order not found");
  }
  return order;
}

async function getOrderById(identifier) {
  const order = await getOrderOrThrow(identifier);
  return presentOrder(order);
}

async function getOrderTimeline(identifier) {
  const order = await getOrderOrThrow(identifier);
  const timeline = await timelineService.getOrderTimeline(order.id);
  return {
    orderId: order.id,
    timeline,
  };
}

async function setOrderIgnored(identifier, isIgnored) {
  const order = await getOrderOrThrow(identifier);

  await withTransaction(async (connection) => {
    await orderRepository.setOrderIgnored(order.id, isIgnored, connection);

    if (isIgnored) {
      await printJobRepository.cancelPendingJobsForOrder(order.id, connection);
      await timelineService.logTimelineEvent(
        {
          orderId: order.id,
          eventType: "ORDER_IGNORED",
          status: "SUCCESS",
          message: "Order marked as ignored",
        },
        connection
      );
      return;
    }

    await timelineService.logTimelineEvent(
      {
        orderId: order.id,
        eventType: "ORDER_UNIGNORED",
        status: "SUCCESS",
        message: "Order un-ignored and returned to processing flow",
      },
      connection
    );

    await printJobService.createJobsForEligibleDepartments(order.id, connection);
  });

  const updatedOrder = await getOrderOrThrow(identifier);
  return presentOrder(updatedOrder);
}

async function retryDepartmentPrint(identifier, departmentInput) {
  const order = await getOrderOrThrow(identifier);
  const department = normalizeDepartment(departmentInput);
  if (!department) {
    throw new HttpError(400, "Invalid department");
  }

  await printJobService.createPrintJob(order.id, department);
  const updatedOrder = await getOrderOrThrow(identifier);
  return presentOrder(updatedOrder);
}

async function resolvePdfPath(identifier, departmentInput) {
  const department = normalizeDepartment(departmentInput);
  if (!department) {
    throw new HttpError(400, "Invalid department");
  }

  const order = await getOrderOrThrow(identifier);
  const pdfColumn = pdfColumnForDepartment(department);
  const pdfPath = order[pdfColumn];
  if (!pdfPath) {
    throw new HttpError(404, `No PDF generated for department ${department}`);
  }

  const absolutePath = path.resolve(process.cwd(), pdfPath);
  try {
    await fs.access(absolutePath);
  } catch (_error) {
    throw new HttpError(404, "PDF file not found on server storage");
  }
  return {
    absolutePath,
    fileName: path.basename(absolutePath),
    orderNumber: order.order_number,
    department,
  };
}

function statusesToDepartmentMap(orderRow) {
  return {
    DM: orderRow.dm_status,
    CONFECTIONERY: orderRow.confectionery_status,
    DESIGN: orderRow.design_status,
  };
}

function isDepartmentActionable(status) {
  return [DEPARTMENT_STATUS.PENDING, DEPARTMENT_STATUS.FAILED].includes(status);
}

async function getActionableDepartments(identifier) {
  const order = await getOrderOrThrow(identifier);
  const map = statusesToDepartmentMap(order);
  return Object.entries(map)
    .filter(([, status]) => isDepartmentActionable(status))
    .map(([department]) => department);
}

module.exports = {
  listOrders,
  getOrderById,
  getOrderTimeline,
  setOrderIgnored,
  retryDepartmentPrint,
  resolvePdfPath,
  getActionableDepartments,
};
