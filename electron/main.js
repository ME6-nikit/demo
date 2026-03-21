const os = require("node:os");
const axios = require("axios");
const { app, BrowserWindow } = require("electron");
const { printPdf } = require("./printPdf");

const BACKEND_URL = process.env.OMA_BACKEND_URL || "http://127.0.0.1:3000";
const MACHINE_ID = process.env.OMA_MACHINE_ID || os.hostname();
const PRINTER_SYNC_INTERVAL_MS = 30000;
const PRINT_JOB_POLL_INTERVAL_MS = 5000;

let pollTimer = null;
let syncTimer = null;
let inFlight = false;

function logInfo(message, extra = undefined) {
  if (extra !== undefined) {
    console.log(`[OMA][electron] ${message}`, extra);
    return;
  }
  console.log(`[OMA][electron] ${message}`);
}

function logError(message, error) {
  console.error(`[OMA][electron] ${message}`, error);
}

async function listLocalPrinters() {
  const probeWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const printers = await probeWindow.webContents.getPrintersAsync();
    return printers.map((printer) => ({
      printer_id: printer.name,
      printer_name: printer.displayName || printer.name,
      status: printer.status === 0 ? "online" : "offline",
    }));
  } finally {
    if (!probeWindow.isDestroyed()) {
      probeWindow.destroy();
    }
  }
}

async function syncPrinters() {
  try {
    const printers = await listLocalPrinters();
    logInfo("Syncing printers to backend", { machine_id: MACHINE_ID, printers });
    await axios.post(`${BACKEND_URL}/api/printers/sync`, {
      machine_id: MACHINE_ID,
      printers,
    });
  } catch (error) {
    logError("Printer sync failed", error.message || error);
  }
}

async function updateJobStatus(jobId, status, message = "") {
  try {
    await axios.post(`${BACKEND_URL}/api/printers/status`, {
      machine_id: MACHINE_ID,
      job_id: jobId,
      status,
      message,
    });
  } catch (error) {
    logError(`Failed to update print status for job=${jobId}`, error.message || error);
  }
}

async function pollPrintJobs() {
  if (inFlight) {
    return;
  }
  inFlight = true;

  try {
    const response = await axios.get(`${BACKEND_URL}/api/print-job`, {
      params: { machine_id: MACHINE_ID },
    });
    const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
    if (jobs.length === 0) {
      return;
    }

    logInfo(`Received ${jobs.length} print job(s)`);
    for (const job of jobs) {
      try {
        await printPdf(job, {
          logger: {
            info: (...args) => logInfo(args[0], args[1]),
            warn: (...args) => console.warn("[OMA][electron]", ...args),
            error: (...args) => console.error("[OMA][electron]", ...args),
          },
        });
        await updateJobStatus(job.id, "Success", "Printed successfully");
      } catch (error) {
        const message = error.message || "Unknown print error";
        logError(`Print failed for job=${job.id}`, message);
        await updateJobStatus(job.id, "Failure", message);
      }
    }
  } catch (error) {
    logError("Print job poll failed", error.message || error);
  } finally {
    inFlight = false;
  }
}

app.whenReady().then(async () => {
  logInfo("Electron print agent is ready", { backend: BACKEND_URL, machine_id: MACHINE_ID });
  await syncPrinters();
  await pollPrintJobs();
  syncTimer = setInterval(syncPrinters, PRINTER_SYNC_INTERVAL_MS);
  pollTimer = setInterval(pollPrintJobs, PRINT_JOB_POLL_INTERVAL_MS);
});

app.on("window-all-closed", () => {
  // Keep process alive as a tray/background print agent.
});

app.on("before-quit", () => {
  if (pollTimer) clearInterval(pollTimer);
  if (syncTimer) clearInterval(syncTimer);
});
