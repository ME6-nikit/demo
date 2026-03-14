const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const EventEmitter = require("node:events");
const test = require("node:test");
const assert = require("node:assert/strict");

const { printPdf } = require("./printPdf");

class MockWebContents extends EventEmitter {
  constructor(printers, capture) {
    super();
    this._printers = printers;
    this._capture = capture;
  }

  async getPrintersAsync() {
    return this._printers;
  }

  async executeJavaScript() {
    return "complete";
  }

  print(options, callback) {
    this._capture.printOptions = options;
    callback(true, "");
  }
}

class MockBrowserWindow extends EventEmitter {
  constructor(printers, capture) {
    super();
    this._capture = capture;
    this._destroyed = false;
    this.webContents = new MockWebContents(printers, capture);
  }

  async loadURL(targetUrl) {
    this._capture.targetUrl = targetUrl;
    this.webContents.emit("did-stop-loading");
  }

  isDestroyed() {
    return this._destroyed;
  }

  destroy() {
    this._destroyed = true;
    this.emit("closed");
  }
}

test("printPdf resolves printer name and prints silently", async () => {
  const tempPdf = path.join(os.tmpdir(), `oma-print-test-${Date.now()}.pdf`);
  fs.writeFileSync(tempPdf, "dummy");

  const capture = {};
  const printers = [
    {
      name: "Epson TM-T88",
      displayName: "Epson TM-T88",
      description: "Local printer",
      status: 0,
      isDefault: true,
    },
  ];

  await printPdf(
    {
      order_id: "123",
      department: "dm",
      printer_id: "PRN-123",
      printer_name: "Epson TM-T88",
      pdf_path: tempPdf,
    },
    {
      BrowserWindow: class extends MockBrowserWindow {
        constructor() {
          super(printers, capture);
        }
      },
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    }
  );

  assert.equal(capture.printOptions.silent, true);
  assert.equal(capture.printOptions.deviceName, "Epson TM-T88");
  assert.match(capture.targetUrl, /^file:\/\//);

  fs.unlinkSync(tempPdf);
});

test("printPdf throws when printer cannot be matched", async () => {
  const tempPdf = path.join(os.tmpdir(), `oma-print-test-${Date.now()}-2.pdf`);
  fs.writeFileSync(tempPdf, "dummy");

  await assert.rejects(
    printPdf(
      {
        order_id: "124",
        department: "design",
        printer_id: "missing-printer",
        pdf_path: tempPdf,
      },
      {
        BrowserWindow: class extends MockBrowserWindow {
          constructor() {
            super(
              [
                {
                  name: "Canon LBP",
                  displayName: "Canon LBP",
                  description: "Office",
                  status: 0,
                },
              ],
              {}
            );
          }
        },
        logger: { info: () => {}, warn: () => {}, error: () => {} },
      }
    ),
    /Requested printer not found/
  );

  fs.unlinkSync(tempPdf);
});
