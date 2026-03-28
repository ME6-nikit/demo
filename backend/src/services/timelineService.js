const timelineRepository = require("../repositories/timelineRepository");

async function logTimelineEvent(event, executor) {
  return timelineRepository.createTimelineEvent(event, executor);
}

async function getOrderTimeline(orderId) {
  return timelineRepository.listTimelineByOrderId(orderId);
}

module.exports = {
  logTimelineEvent,
  getOrderTimeline,
};
