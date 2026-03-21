const { STATUS_COLOR_MAP } = require("../constants/statuses");

function deriveDeliverySlot(orderRow) {
  return orderRow.specific_delivery_time || orderRow.delivery_time || null;
}

function presentDepartment(status, pdfPath) {
  return {
    status,
    color: STATUS_COLOR_MAP[status] || "Grey",
    pdfPath: pdfPath || null,
  };
}

function presentOrder(orderRow) {
  return {
    id: orderRow.id,
    shopifyOrderId: orderRow.order_id,
    orderNumber: orderRow.order_number,
    customerName: orderRow.customer_name,
    orderDate: orderRow.order_date,
    deliveryDate: orderRow.delivery_date,
    deliveryTime: orderRow.delivery_time,
    specificDeliveryTime: orderRow.specific_delivery_time,
    deliverySlot: deriveDeliverySlot(orderRow),
    shippingMethod: orderRow.shipping_method,
    reserved: Boolean(orderRow.reserved),
    isIgnored: Boolean(orderRow.is_ignored),
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    departments: {
      DM: presentDepartment(orderRow.dm_status, orderRow.dm_pdf_path),
      CONFECTIONERY: presentDepartment(orderRow.confectionery_status, orderRow.confectionery_pdf_path),
      DESIGN: presentDepartment(orderRow.design_status, orderRow.design_pdf_path),
    },
  };
}

module.exports = {
  deriveDeliverySlot,
  presentOrder,
};
