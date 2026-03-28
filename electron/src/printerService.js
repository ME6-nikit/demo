const axios = require("axios");
const config = require("./config");

let pollingInterval = null;
const POLL_INTERVAL_MS = 10000;
const SYNC_INTERVAL_MS = 30000;

async function getLocalPrinters() {
  try {
    const { BrowserWindow } = require("electron");
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return [];
    const printers = win.webContents.getPrinters();
    return printers.map((p) => ({
      printerId: p.name.replace(/\s+/g, "_"),
      printerName: p.name,
      status: p.status === 0 ? "ONLINE" : "OFFLINE",
      isDefault: p.isDefault,
    }));
  } catch {
    return [];
  }
}

async function detectAndSyncPrinters() {
  const printers = await getLocalPrinters();
  const machineId = config.getMachineId();
  const backendUrl = config.getBackendUrl();

  try {
    await axios.post(`${backendUrl}/api/printers/sync`, {
      machineId,
      printers,
    });
    console.log(`Synced ${printers.length} printers to backend`);
  } catch (error) {
    console.error("Failed to sync printers:", error.message);
  }
}

async function pollPendingJobs() {
  const machineId = config.getMachineId();
  const backendUrl = config.getBackendUrl();

  try {
    const response = await axios.get(`${backendUrl}/api/print-jobs/pending`, {
      params: { machineId, limit: 10 },
    });

    const jobs = response.data.jobs || [];
    for (const job of jobs) {
      await processPrintJob(job);
    }
  } catch (error) {
    console.error("Failed to poll print jobs:", error.message);
  }
}

async function processPrintJob(job) {
  const backendUrl = config.getBackendUrl();
  try {
    await axios.post(`${backendUrl}/api/print-jobs/${job.id}/status`, {
      status: "IN-PROGRESS",
      message: "Printing started",
    });

    // Actual printing would happen here using Electron's print API
    console.log(`Processing print job ${job.id} for ${job.department}`);

    await axios.post(`${backendUrl}/api/print-jobs/${job.id}/status`, {
      status: "SUCCESS",
      message: "Print completed",
    });
  } catch (error) {
    console.error(`Print job ${job.id} failed:`, error.message);
    try {
      await axios.post(`${backendUrl}/api/print-jobs/${job.id}/status`, {
        status: "FAILED",
        message: error.message,
      });
    } catch {
      // Status update best-effort
    }
  }
}

function startPolling() {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    await pollPendingJobs();
  }, POLL_INTERVAL_MS);

  setInterval(async () => {
    await detectAndSyncPrinters();
  }, SYNC_INTERVAL_MS);

  console.log("Print job polling started");
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

module.exports = {
  getLocalPrinters,
  detectAndSyncPrinters,
  pollPendingJobs,
  startPolling,
  stopPolling,
};
