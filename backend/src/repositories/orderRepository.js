const { all, get, run } = require("../models/db");
const { nowSql } = require("../utils/time");

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

async function upsertOrder(order) {
  const now = nowSql();
  await run(
    `
      INSERT INTO orders (
        order_id, order_number, customer_name, delivery_date, delivery_time,
        shipping_method, items_json, tags_json, is_draft, ignored, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      ON DUPLICATE KEY UPDATE
        order_number = VALUES(order_number),
        customer_name = VALUES(customer_name),
        delivery_date = VALUES(delivery_date),
        delivery_time = VALUES(delivery_time),
        shipping_method = VALUES(shipping_method),
        items_json = VALUES(items_json),
        tags_json = VALUES(tags_json),
        is_draft = VALUES(is_draft),
        updated_at = VALUES(updated_at)
    `,
    [
      order.order_id,
      order.order_number || null,
      order.customer_name || null,
      order.delivery_date || null,
      order.delivery_time || null,
      order.shipping_method || null,
      JSON.stringify(order.items || []),
      JSON.stringify(order.tags || []),
      order.is_draft ? 1 : 0,
      now,
      now,
    ]
  );
}

async function getOrderByOrderId(orderId) {
  const row = await get("SELECT * FROM orders WHERE order_id = ?", [orderId]);
  if (!row) return null;
  return {
    ...row,
    items: parseJson(row.items_json, []),
    tags: parseJson(row.tags_json, []),
    is_draft: Boolean(row.is_draft),
    ignored: Boolean(row.ignored),
  };
}

async function listOrders({ actionRequired = false } = {}) {
  const filterSql = actionRequired
    ? `
      WHERE o.ignored = 0 AND EXISTS (
        SELECT 1 FROM order_department_status ods
        WHERE ods.order_id = o.order_id
          AND ods.status IN ('Pending', 'In-Progress', 'Failure')
      )
    `
    : "";

  const rows = await all(
    `
      SELECT o.*
      FROM orders o
      ${filterSql}
      ORDER BY o.updated_at DESC
    `
  );

  return rows.map((row) => ({
    ...row,
    items: parseJson(row.items_json, []),
    tags: parseJson(row.tags_json, []),
    is_draft: Boolean(row.is_draft),
    ignored: Boolean(row.ignored),
  }));
}

async function setIgnored(orderId, ignored) {
  await run("UPDATE orders SET ignored = ?, updated_at = ? WHERE order_id = ?", [
    ignored ? 1 : 0,
    nowSql(),
    orderId,
  ]);
}

async function touchOrder(orderId) {
  await run("UPDATE orders SET updated_at = ? WHERE order_id = ?", [nowSql(), orderId]);
}

module.exports = {
  upsertOrder,
  getOrderByOrderId,
  listOrders,
  setIgnored,
  touchOrder,
};
