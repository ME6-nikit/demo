const { all, get, run } = require("../models/db");
const { nowSql } = require("../utils/time");

async function upsertOrderPdfPaths(orderId, paths) {
  await run(
    `
      INSERT INTO order_pdfs(order_id, dm_pdf_path, confectionery_pdf_path, design_pdf_path, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dm_pdf_path = VALUES(dm_pdf_path),
        confectionery_pdf_path = VALUES(confectionery_pdf_path),
        design_pdf_path = VALUES(design_pdf_path),
        updated_at = VALUES(updated_at)
    `,
    [
      orderId,
      paths.dm_pdf_path || null,
      paths.confectionery_pdf_path || null,
      paths.design_pdf_path || null,
      nowSql(),
    ]
  );
}

function getOrderPdfPaths(orderId) {
  return get("SELECT * FROM order_pdfs WHERE order_id = ?", [orderId]);
}

async function getOrderPdfPathsForOrders(orderIds) {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => "?").join(", ");
  return all(`SELECT * FROM order_pdfs WHERE order_id IN (${placeholders})`, orderIds);
}

module.exports = {
  upsertOrderPdfPaths,
  getOrderPdfPaths,
  getOrderPdfPathsForOrders,
};
