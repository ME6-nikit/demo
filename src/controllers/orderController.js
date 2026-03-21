const orderService = require("../services/orderService");
const HttpError = require("../utils/httpError");

async function listOrders(req, res, next) {
  try {
    const result = await orderService.listOrders(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const result = await orderService.getOrderById(req.params.orderId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getOrderTimeline(req, res, next) {
  try {
    const result = await orderService.getOrderTimeline(req.params.orderId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateIgnoreStatus(req, res, next) {
  try {
    if (typeof req.body?.isIgnored !== "boolean") {
      throw new HttpError(400, "Request body must include boolean field: isIgnored");
    }

    const result = await orderService.setOrderIgnored(req.params.orderId, req.body.isIgnored);
    res.json({
      message: req.body.isIgnored ? "Order ignored" : "Order un-ignored",
      order: result,
    });
  } catch (error) {
    next(error);
  }
}

async function retryDepartmentPrint(req, res, next) {
  try {
    const result = await orderService.retryDepartmentPrint(req.params.orderId, req.params.department);
    res.json({
      message: "Print retry triggered",
      order: result,
    });
  } catch (error) {
    next(error);
  }
}

async function downloadDepartmentPdf(req, res, next) {
  try {
    const result = await orderService.resolvePdfPath(req.params.orderId, req.params.department);
    res.download(result.absolutePath, `${result.orderNumber}_${result.department}.pdf`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listOrders,
  getOrderById,
  getOrderTimeline,
  updateIgnoreStatus,
  retryDepartmentPrint,
  downloadDepartmentPdf,
};
