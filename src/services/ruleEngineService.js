const env = require("../config/env");
const { DEPARTMENT_LIST } = require("../constants/departments");

function includesText(value, needle) {
  return String(value || "").toLowerCase().includes(needle.toLowerCase());
}

function extractLineItemTitles(payload) {
  return (payload.line_items || []).map((item) => item?.title || item?.name || "");
}

function evaluateOrderRules(payload, normalizedOrder) {
  const shippingMethod = normalizedOrder.shippingMethod || "";
  const tags = payload.tags || "";
  const lineItemTitles = extractLineItemTitles(payload);

  const superExtendedDelivery =
    includesText(shippingMethod, "super extended delivery") || includesText(tags, "super extended delivery");

  const additionalCustomizationCharges = lineItemTitles.some((title) =>
    includesText(title, "additional customization charges")
  );

  const missingDeliveryInfo = !normalizedOrder.deliveryDate || (!normalizedOrder.deliveryTime && !normalizedOrder.specificDeliveryTime);

  const draftOrder = Boolean(payload.draft_order_id) || includesText(tags, "draft");

  const designerCake = lineItemTitles.some((title) => includesText(title, "designer cake")) || includesText(tags, "designer cake");

  const allDepartmentsRequired = superExtendedDelivery || additionalCustomizationCharges || missingDeliveryInfo || draftOrder;

  if (allDepartmentsRequired) {
    return {
      requiredDepartments: [...DEPARTMENT_LIST],
      reason: "ALL_DEPARTMENTS_RULE_MATCHED",
      flags: {
        superExtendedDelivery,
        additionalCustomizationCharges,
        missingDeliveryInfo,
        draftOrder,
        designerCake,
      },
    };
  }

  if (designerCake) {
    return {
      requiredDepartments: [...new Set(env.designerCakeDepartments)],
      reason: "DESIGNER_CAKE_RULE_MATCHED",
      flags: {
        superExtendedDelivery,
        additionalCustomizationCharges,
        missingDeliveryInfo,
        draftOrder,
        designerCake,
      },
    };
  }

  return {
    requiredDepartments: [...DEPARTMENT_LIST],
    reason: "DEFAULT_RULE_APPLIED",
    flags: {
      superExtendedDelivery,
      additionalCustomizationCharges,
      missingDeliveryInfo,
      draftOrder,
      designerCake,
    },
  };
}

module.exports = {
  evaluateOrderRules,
};
