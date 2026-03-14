const { all, run } = require("../models/db");
const { Department } = require("../utils/constants");
const { nowSql } = require("../utils/time");

async function upsertDepartmentStatus(orderId, department, status, lastMessage = null) {
  await run(
    `
      INSERT INTO order_department_status(order_id, department, status, last_message, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        last_message = VALUES(last_message),
        updated_at = VALUES(updated_at)
    `,
    [orderId, department, status, lastMessage, nowSql()]
  );
}

async function setDepartmentStatuses(orderId, statuses) {
  const departments = [Department.DM, Department.CONFECTIONERY, Department.DESIGN];
  // Keep all departments represented for stable UI rendering.
  for (const department of departments) {
    const statusObj = statuses[department];
    if (!statusObj) continue;
    await upsertDepartmentStatus(orderId, department, statusObj.status, statusObj.message || null);
  }
}

async function getDepartmentStatuses(orderId) {
  return all(
    "SELECT department, status, last_message, updated_at FROM order_department_status WHERE order_id = ?",
    [orderId]
  );
}

async function getDepartmentStatusesForOrders(orderIds) {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => "?").join(", ");
  return all(
    `SELECT order_id, department, status, last_message, updated_at
      FROM order_department_status
      WHERE order_id IN (${placeholders})`,
    orderIds
  );
}

module.exports = {
  upsertDepartmentStatus,
  setDepartmentStatuses,
  getDepartmentStatuses,
  getDepartmentStatusesForOrders,
};
