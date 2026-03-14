const { all, run } = require("../models/db");
const { nowSql } = require("../utils/time");

async function addTimelineEvent(orderId, eventType, status, message) {
  await run(
    `
      INSERT INTO order_timeline(order_id, event_type, status, message, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `,
    [orderId, eventType, status || null, message, nowSql()]
  );
}

async function listTimeline(orderId) {
  return all(
    `
      SELECT * FROM order_timeline
      WHERE order_id = ?
      ORDER BY timestamp DESC
    `,
    [orderId]
  );
}

module.exports = {
  addTimelineEvent,
  listTimeline,
};
