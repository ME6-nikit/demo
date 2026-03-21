function getNoteAttribute(payload, key) {
  const attrs = payload.note_attributes || payload.noteAttributes || [];
  const match = attrs.find((item) => String(item.name || item.key || "").toLowerCase() === key.toLowerCase());
  return match ? String(match.value || "").trim() : "";
}

function parseBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapShopifyOrderPayload(payload) {
  const firstName = payload.customer?.first_name || "";
  const lastName = payload.customer?.last_name || "";
  const customerName = `${firstName} ${lastName}`.trim() || payload.email || "Guest";

  const deliveryDate = getNoteAttribute(payload, "delivery_date") || getNoteAttribute(payload, "delivery date");
  const deliveryTime = getNoteAttribute(payload, "delivery_time") || getNoteAttribute(payload, "delivery time");
  const specificDeliveryTime =
    getNoteAttribute(payload, "specific_delivery_time") || getNoteAttribute(payload, "specific delivery time");
  const reservedRaw = getNoteAttribute(payload, "reserved");

  const shippingMethod = payload.shipping_lines?.[0]?.title || payload.shipping_lines?.[0]?.code || "";

  return {
    shopifyOrderId: String(payload.id),
    orderNumber: String(payload.order_number || payload.name || payload.id),
    customerName,
    orderDate: parseDate(payload.created_at),
    deliveryDate: deliveryDate || null,
    deliveryTime: deliveryTime || null,
    specificDeliveryTime: specificDeliveryTime || null,
    shippingMethod: shippingMethod || null,
    reserved: parseBoolean(reservedRaw),
    rawPayload: payload,
  };
}

module.exports = {
  mapShopifyOrderPayload,
};
