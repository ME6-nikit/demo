const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const printerService = require("./printerService");
const config = require("./config");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.argv.includes("--dev")) {
    mainWindow.loadURL("http://localhost:3001");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }
}

app.whenReady().then(async () => {
  createWindow();

  await printerService.detectAndSyncPrinters();
  printerService.startPolling();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  printerService.stopPolling();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-printers", () => {
  return printerService.getLocalPrinters();
});

ipcMain.handle("get-machine-id", () => {
  return config.getMachineId();
});

ipcMain.handle("sync-printers", () => {
  return printerService.detectAndSyncPrinters();
});
