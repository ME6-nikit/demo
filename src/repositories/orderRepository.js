const { pool } = require("../db/pool");

function getExecutor(executor) {
  return executor || pool;
}

async function upsertOrderFromShopify(orderData, executor) {
  const db = getExecutor(executor);
  const {
    shopifyOrderId,
    orderNumber,
    customerName,
    orderDate,
    deliveryDate,
    deliveryTime,
    specificDeliveryTime,
    shippingMethod,
    reserved,
    rawPayload,
  } = orderData;

  await db.query(
    `
      INSERT INTO orders (
        order_id,
        order_number,
        customer_name,
        order_date,
        delivery_date,
        delivery_time,
        specific_delivery_time,
        shipping_method,
        reserved,
        raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        order_number = VALUES(order_number),
        customer_name = VALUES(customer_name),
        order_date = VALUES(order_date),
        delivery_date = VALUES(delivery_date),
        delivery_time = VALUES(delivery_time),
        specific_delivery_time = VALUES(specific_delivery_time),
        shipping_method = VALUES(shipping_method),
        reserved = VALUES(reserved),
        raw_payload = VALUES(raw_payload)
    `,
    [
      shopifyOrderId,
      orderNumber,
      customerName,
      orderDate,
      deliveryDate,
      deliveryTime,
      specificDeliveryTime,
      shippingMethod,
      reserved ? 1 : 0,
      JSON.stringify(rawPayload),
    ]
  );

  const [rows] = await db.query("SELECT * FROM orders WHERE order_id = ?", [shopifyOrderId]);
  return rows[0] || null;
}

async function ensureOrderSubrecords(orderId, executor) {
  const db = getExecutor(executor);
  await db.query("INSERT IGNORE INTO order_department_status (order_id) VALUES (?)", [orderId]);
  await db.query("INSERT IGNORE INTO order_pdfs (order_id) VALUES (?)", [orderId]);
}

async function updateDepartmentStatuses(orderId, statusMap, executor) {
  const db = getExecutor(executor);
  await db.query(
    `
      UPDATE order_department_status
      SET dm_status = ?, confectionery_status = ?, design_status = ?
      WHERE order_id = ?
    `,
    [statusMap.dm, statusMap.confectionery, statusMap.design, orderId]
  );
}

async function updateDepartmentStatus(orderId, column, status, executor) {
  const db = getExecutor(executor);
  await db.query(`UPDATE order_department_status SET ${column} = ? WHERE order_id = ?`, [status, orderId]);
}

async function updatePdfPaths(orderId, pdfMap, executor) {
  const db = getExecutor(executor);
  await db.query(
    `
      UPDATE order_pdfs
      SET dm_pdf_path = ?, confectionery_pdf_path = ?, design_pdf_path = ?
      WHERE order_id = ?
    `,
    [pdfMap.dm || null, pdfMap.confectionery || null, pdfMap.design || null, orderId]
  );
}

async function getOrderByInternalId(orderId, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        o.*,
        ods.dm_status,
        ods.confectionery_status,
        ods.design_status,
        op.dm_pdf_path,
        op.confectionery_pdf_path,
        op.design_pdf_path
      FROM orders o
      LEFT JOIN order_department_status ods ON ods.order_id = o.id
      LEFT JOIN order_pdfs op ON op.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
    `,
    [orderId]
  );
  return rows[0] || null;
}

async function getOrderByIdentifier(identifier, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        o.*,
        ods.dm_status,
        ods.confectionery_status,
        ods.design_status,
        op.dm_pdf_path,
        op.confectionery_pdf_path,
        op.design_pdf_path
      FROM orders o
      LEFT JOIN order_department_status ods ON ods.order_id = o.id
      LEFT JOIN order_pdfs op ON op.order_id = o.id
      WHERE o.id = ? OR o.order_id = ?
      ORDER BY o.id = ? DESC
      LIMIT 1
    `,
    [identifier, identifier, identifier]
  );
  return rows[0] || null;
}

function buildOrderFilters(filters) {
  const clauses = [];
  const params = [];

  if (filters.orderNo) {
    clauses.push("o.order_number LIKE ?");
    params.push(`%${filters.orderNo}%`);
  }

  if (filters.orderDate) {
    clauses.push("DATE(o.order_date) = ?");
    params.push(filters.orderDate);
  }

  if (filters.deliveryDate) {
    clauses.push("o.delivery_date = ?");
    params.push(filters.deliveryDate);
  }

  if (filters.deliverySlot) {
    clauses.push("COALESCE(NULLIF(o.specific_delivery_time, ''), o.delivery_time) = ?");
    params.push(filters.deliverySlot);
  }

  if (filters.view === "action_required") {
    clauses.push(
      "(ods.dm_status IN ('PENDING', 'FAILED', 'IN-PROGRESS') OR ods.confectionery_status IN ('PENDING', 'FAILED', 'IN-PROGRESS') OR ods.design_status IN ('PENDING', 'FAILED', 'IN-PROGRESS'))"
    );
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

async function listOrders(filters, pagination, executor) {
  const db = getExecutor(executor);
  const { where, params } = buildOrderFilters(filters);

  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM orders o
      LEFT JOIN order_department_status ods ON ods.order_id = o.id
      ${where}
    `,
    params
  );

  const [rows] = await db.query(
    `
      SELECT
        o.*,
        ods.dm_status,
        ods.confectionery_status,
        ods.design_status,
        op.dm_pdf_path,
        op.confectionery_pdf_path,
        op.design_pdf_path
      FROM orders o
      LEFT JOIN order_department_status ods ON ods.order_id = o.id
      LEFT JOIN order_pdfs op ON op.order_id = o.id
      ${where}
      ORDER BY COALESCE(o.order_date, o.created_at) DESC
      LIMIT ?
      OFFSET ?
    `,
    [...params, pagination.limit, pagination.offset]
  );

  return {
    total: countRows[0]?.total || 0,
    rows,
  };
}

async function setOrderIgnored(orderId, isIgnored, executor) {
  const db = getExecutor(executor);
  await db.query("UPDATE orders SET is_ignored = ? WHERE id = ?", [isIgnored ? 1 : 0, orderId]);
}

module.exports = {
  upsertOrderFromShopify,
  ensureOrderSubrecords,
  updateDepartmentStatuses,
  updateDepartmentStatus,
  updatePdfPaths,
  getOrderByInternalId,
  getOrderByIdentifier,
  listOrders,
  setOrderIgnored,
};
