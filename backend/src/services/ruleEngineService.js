const { Department, DepartmentStatus } = require("../utils/constants");

const DESIGNER_CAKE_TAG = "ORDER-MANAGEMENT-AUTOMATION-DESIGNER-CAKE";

function basePendingStatuses() {
  return {
    [Department.DM]: { status: DepartmentStatus.PENDING, message: "Awaiting print" },
    [Department.CONFECTIONERY]: { status: DepartmentStatus.PENDING, message: "Awaiting print" },
    [Department.DESIGN]: { status: DepartmentStatus.PENDING, message: "Awaiting print" },
  };
}

function containsCustomizationCharge(items = []) {
  return items.some((item) =>
    String(item.title || item.name || "").toLowerCase().includes("additional customization charges")
  );
}

function evaluateOrderRules(order) {
  const statuses = basePendingStatuses();
  const reasons = [];

  if ((order.shipping_method || "").trim().toLowerCase() === "super extended delivery") {
    reasons.push("Rule 1 matched: Super Extended Delivery");
    return { statuses, reasons };
  }

  if (containsCustomizationCharge(order.items || [])) {
    reasons.push("Rule 2 matched: Additional Customization Charges");
    return { statuses, reasons };
  }

  if (!order.delivery_date || !order.delivery_time) {
    reasons.push("Rule 3 matched: Missing delivery date/time");
    return { statuses, reasons };
  }

  if (order.is_draft) {
    reasons.push("Rule 4 matched: Draft order");
    return { statuses, reasons };
  }

  const tagsUpper = (order.tags || []).map((tag) => String(tag).toUpperCase());
  if (tagsUpper.includes(DESIGNER_CAKE_TAG)) {
    statuses[Department.DESIGN] = {
      status: DepartmentStatus.NA,
      message: "Rule 5 matched: Designer cake tag",
    };
    reasons.push("Rule 5 matched: Designer cake");
    return { statuses, reasons };
  }

  reasons.push("Rule 6 matched: Default");
  return { statuses, reasons };
}

module.exports = {
  evaluateOrderRules,
  DESIGNER_CAKE_TAG,
};
