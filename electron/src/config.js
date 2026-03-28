const { v4: uuidv4 } = require("uuid");

let machineId = null;

function getMachineId() {
  if (!machineId) {
    try {
      const Store = require("electron-store");
      const store = new Store();
      machineId = store.get("machineId");
      if (!machineId) {
        machineId = `OMA-${uuidv4().slice(0, 8).toUpperCase()}`;
        store.set("machineId", machineId);
      }
    } catch {
      machineId = `OMA-${uuidv4().slice(0, 8).toUpperCase()}`;
    }
  }
  return machineId;
}

function getBackendUrl() {
  return process.env.OMA_BACKEND_URL || "http://localhost:3000";
}

module.exports = {
  getMachineId,
  getBackendUrl,
};
