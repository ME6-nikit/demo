const { pool } = require("../db/pool");

function getExecutor(executor) {
  return executor || pool;
}

async function createTimelineEvent(event, executor) {
  const db = getExecutor(executor);
  const { orderId, eventType, status, department, message, metadata } = event;

  const [result] = await db.query(
    `
      INSERT INTO order_timeline (
        order_id,
        event_type,
        status,
        department,
        message,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [orderId, eventType, status, department || null, message, metadata ? JSON.stringify(metadata) : null]
  );
  return result.insertId;
}

async function listTimelineByOrderId(orderId, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.query(
    `
      SELECT
        id,
        order_id,
        event_type,
        status,
        department,
        message,
        metadata,
        created_at AS timestamp
      FROM order_timeline
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [orderId]
  );
  return rows.map((row) => {
    let metadata = row.metadata;
    if (typeof row.metadata === "string") {
      try {
        metadata = JSON.parse(row.metadata);
      } catch (_error) {
        metadata = row.metadata;
      }
    }
    return {
      ...row,
      metadata,
    };
  });
}

module.exports = {
  createTimelineEvent,
  listTimelineByOrderId,
};
