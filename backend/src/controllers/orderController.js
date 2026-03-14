const path = require("path");
const {
  listOrdersView,
  resolveDepartmentPdf,
  getOrderTimeline,
  ignoreOrder,
} = require("../services/orderService");

async function list(req, res, next) {
  try {
    const actionRequired = req.query.actionRequired === "true";
    const orders = await listOrdersView({ actionRequired });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
}

async function timeline(req, res, next) {
  try {
    const data = await getOrderTimeline(req.params.orderId);
    return res.json({ timeline: data });
  } catch (error) {
    return next(error);
  }
}

async function updateIgnore(req, res, next) {
  try {
    await ignoreOrder(req.params.orderId, Boolean(req.body?.ignored));
    return res.json({ message: "Ignore state updated" });
  } catch (error) {
    return next(error);
  }
}

async function downloadDepartmentPdf(req, res, next) {
  try {
    const result = await resolveDepartmentPdf(req.params.orderId, req.params.department);
    if (!result) return res.status(404).json({ message: "PDF not found" });
    if (result.disabled) return res.status(400).json({ message: result.reason });
    const fileName = path.basename(result.path);
    return res.download(result.path, fileName);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  timeline,
  updateIgnore,
  downloadDepartmentPdf,
};
