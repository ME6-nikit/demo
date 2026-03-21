const fs = require("node:fs");
const path = require("node:path");
const { BrowserWindow } = require("electron");

const ACTIVE_PRINT_WINDOWS = new Set();

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function toPrintablePrinterSummary(printer) {
  return {
    name: printer.name,
    displayName: printer.displayName || "",
    description: printer.description || "",
    status: printer.status || "",
    isDefault: Boolean(printer.isDefault),
  };
}

async function resolveTargetPrinter(webContents, job, logger) {
  const printers = await webContents.getPrintersAsync();
  const requestedPrinterId = normalize(job.printer_id);
  const requestedPrinterName = normalize(job.printer_name);

  logger.info("[OMA][printPdf] Installed printers:", printers.map(toPrintablePrinterSummary));

  const exactMatch = printers.find((printer) => {
    const candidates = [
      normalize(printer.name),
      normalize(printer.displayName),
      normalize(printer.description),
    ];
    return candidates.includes(requestedPrinterId) || candidates.includes(requestedPrinterName);
  });

  if (exactMatch) {
    return { printer: exactMatch, printers };
  }

  // Fuzzy fallback for cases where backend stores aliases.
  const fuzzyMatch = printers.find((printer) => {
    const candidates = [
      normalize(printer.name),
      normalize(printer.displayName),
      normalize(printer.description),
    ];
    return candidates.some(
      (candidate) =>
        (requestedPrinterId && candidate.includes(requestedPrinterId)) ||
        (requestedPrinterName && candidate.includes(requestedPrinterName))
    );
  });

  return { printer: fuzzyMatch || null, printers };
}

function cleanupWindow(printWindow, logger) {
  if (!printWindow || printWindow.isDestroyed()) {
    return;
  }
  try {
    printWindow.webContents.removeAllListeners("did-fail-load");
    printWindow.webContents.removeAllListeners("render-process-gone");
    printWindow.webContents.removeAllListeners("unresponsive");
  } catch (error) {
    logger.warn("[OMA][printPdf] Cleanup listener removal warning:", error.message);
  }
  try {
    printWindow.destroy();
  } catch (error) {
    logger.warn("[OMA][printPdf] Window destroy warning:", error.message);
  }
}

function waitForPdfReady(printWindow, logger, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId;

    const done = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    timeoutId = setTimeout(() => {
      done(new Error(`Timed out waiting for PDF readiness after ${timeoutMs}ms`));
    }, timeoutMs);

    printWindow.webContents.once("did-fail-load", (_event, code, description, url, isMainFrame) => {
      if (isMainFrame) {
        done(new Error(`Failed to load PDF (${code}): ${description}. URL=${url}`));
      }
    });

    printWindow.webContents.once("did-stop-loading", async () => {
      try {
        const readyState = await printWindow.webContents
          .executeJavaScript("document.readyState", true)
          .catch(() => "unknown");
        logger.info(`[OMA][printPdf] did-stop-loading; readyState=${readyState}`);

        // The PDF plugin can finish parsing slightly after did-stop-loading.
        setTimeout(() => done(), 500);
      } catch (error) {
        done(error);
      }
    });
  });
}

/**
 * Fixes applied for reliable silent physical printing:
 * 1) Resolves `deviceName` against actual installed printer names before printing.
 * 2) Waits for full PDF load (`did-stop-loading` + short delay), not only did-finish-load.
 * 3) Disables background throttling in hidden window to avoid stalled render.
 * 4) Keeps a strong ref to print windows until callback returns to prevent early GC.
 * 5) Adds detailed diagnostics for printers, target path, and print callback result.
 */
async function printPdf(job, deps = {}) {
  const logger = deps.logger || console;
  const BrowserWindowImpl = deps.BrowserWindow || BrowserWindow;

  const pdfPath = job.pdf_path;
  if (!pdfPath) {
    throw new Error("Missing pdf_path");
  }

  const isRemotePath = /^https?:\/\//i.test(pdfPath);
  if (!isRemotePath && !fs.existsSync(pdfPath)) {
    throw new Error(`PDF path not found: ${pdfPath}`);
  }

  const targetUrl = isRemotePath ? pdfPath : `file://${path.resolve(pdfPath)}`;
  logger.info("[OMA][printPdf] Starting print job", {
    order_id: job.order_id,
    department: job.department,
    printer_id: job.printer_id,
    printer_name: job.printer_name || null,
    targetUrl,
  });

  const printWindow = new BrowserWindowImpl({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  ACTIVE_PRINT_WINDOWS.add(printWindow);

  printWindow.on("closed", () => {
    ACTIVE_PRINT_WINDOWS.delete(printWindow);
  });

  printWindow.webContents.on("render-process-gone", (_event, details) => {
    logger.error("[OMA][printPdf] Render process gone:", details);
  });
  printWindow.webContents.on("unresponsive", () => {
    logger.error("[OMA][printPdf] Print window became unresponsive");
  });

  try {
    const readyPromise = waitForPdfReady(printWindow, logger);
    await printWindow.loadURL(targetUrl);
    await readyPromise;

    const { printer, printers } = await resolveTargetPrinter(printWindow.webContents, job, logger);
    if (!printer) {
      const available = printers.map((p) => p.name).join(", ");
      throw new Error(
        `Requested printer not found. printer_id=${job.printer_id || ""}, printer_name=${
          job.printer_name || ""
        }, available=[${available}]`
      );
    }

    await new Promise((resolve, reject) => {
      const printOptions = {
        silent: true,
        printBackground: true,
        deviceName: printer.name,
      };
      logger.info("[OMA][printPdf] Calling webContents.print", printOptions);

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          logger.error("[OMA][printPdf] Print failed", {
            failureReason: failureReason || "Unknown print failure",
            printer: toPrintablePrinterSummary(printer),
            targetUrl,
          });
          reject(new Error(failureReason || "Unknown print failure"));
          return;
        }

        logger.info("[OMA][printPdf] Print success", {
          printer: toPrintablePrinterSummary(printer),
          targetUrl,
        });
        resolve();
      });
    });
  } finally {
    cleanupWindow(printWindow, logger);
  }
}

module.exports = {
  printPdf,
};
