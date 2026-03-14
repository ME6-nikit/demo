const app = require("./app");
const { port } = require("./config/env");
const { initDb } = require("./models/db");
const { ensureDirSync } = require("./utils/fs");
const { storageRoot, pdfRoot } = require("./config/env");

async function start() {
  try {
    ensureDirSync(storageRoot);
    ensureDirSync(pdfRoot);
    await initDb();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`OMA backend listening on port ${port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start backend", err);
    process.exit(1);
  }
}

start();
