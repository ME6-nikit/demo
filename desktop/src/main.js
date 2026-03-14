const path = require("path");
const fs = require("fs");
const { app, BrowserWindow } = require("electron");
const axios = require("axios");
const { machineIdSync } = require("node-machine-id");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);
const MACHINE_ID = process.env.MACHINE_ID || machineIdSync({ original: false });

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let mainWindow;
let syncRunning = false;
let pollRunning = false;

function log(message) {
  const line = `[OMA Desktop] ${message}`;
  console.log(line);
  if (mainWindow) {
    mainWindow.webContents.send("log-line", `${new Date().toISOString()} ${line}`);
  }
}

function normalizeStatus(printer) {
  const raw = String(printer.status ?? "").toLowerCase();
  if (raw.includes("offline")) return "offline";
  return "online";
}

async function detectPrinters() {
  if (!mainWindow) return [];
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((printer) => ({
    printer_id: printer.name,
    printer_name: printer.displayName || printer.name,
    status: normalizeStatus(printer),
  }));
}

async function syncPrintersAndStatuses() {
  if (syncRunning) return;
  syncRunning = true;
  try {
    const printers = await detectPrinters();
    await api.post("/api/printers/sync", {
      machine_id: MACHINE_ID,
      printers,
    });
    await api.post("/api/printers/status", {
      statuses: printers.map((printer) => ({
        printer_id: printer.printer_id,
        status: printer.status,
      })),
    });
    log(`Synced ${printers.length} printers`);
  } catch (error) {
    log(`Printer sync failed: ${error.message}`);
  } finally {
    syncRunning = false;
  }
}

async function printPdf(job) {
  const pdfPath = job.pdf_path;
  if (!pdfPath) {
    throw new Error("Missing pdf_path");
  }
  if (!pdfPath.startsWith("http") && !fs.existsSync(pdfPath)) {
    throw new Error(`PDF path not found: ${pdfPath}`);
  }

  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const targetUrl = pdfPath.startsWith("http")
      ? pdfPath
      : `file://${path.resolve(pdfPath)}`;

    printWindow.webContents.once("did-finish-load", () => {
      printWindow.webContents.print(
        {
          silent: true,
          deviceName: job.printer_id,
          printBackground: true,
        },
        (success, failureReason) => {
          printWindow.close();
          if (!success) {
            return reject(new Error(failureReason || "Unknown print failure"));
          }
          return resolve();
        }
      );
    });

    printWindow.loadURL(targetUrl).catch((err) => {
      printWindow.close();
      reject(err);
    });
  });
}

async function pollPrintJobs() {
  if (pollRunning) return;
  pollRunning = true;
  try {
    const res = await api.post("/api/print-job", { machine_id: MACHINE_ID });
    const job = res.data?.job;
    if (!job) return;

    log(`Received job ${job.id} for ${job.department}`);
    try {
      await printPdf(job);
      await api.post("/api/print-job/status", {
        job_id: job.id,
        status: "Success",
      });
      log(`Print success for job ${job.id}`);
    } catch (err) {
      await api.post("/api/print-job/status", {
        job_id: job.id,
        status: "Failure",
        error_message: err.message,
      });
      log(`Print failed for job ${job.id}: ${err.message}`);
    }
  } catch (error) {
    log(`Polling failed: ${error.message}`);
  } finally {
    pollRunning = false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 620,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(async () => {
  createWindow();
  log(`Desktop app started. machine_id=${MACHINE_ID}`);
  await syncPrintersAndStatuses();
  setInterval(syncPrintersAndStatuses, POLL_INTERVAL_MS);
  setInterval(pollPrintJobs, POLL_INTERVAL_MS);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
