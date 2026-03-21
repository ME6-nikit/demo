const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

function parseNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 3000),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "oma",
    connectionLimit: parseNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
  shopifyWebhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || "",
  pdfStorageDir: path.resolve(process.cwd(), process.env.PDF_STORAGE_DIR || "storage/pdfs"),
  designerCakeDepartments: (process.env.DESIGNER_CAKE_DEPARTMENTS || "DESIGN,CONFECTIONERY")
    .split(",")
    .map((department) => department.trim().toUpperCase())
    .filter(Boolean),
  autoTriggerPrintJobs: parseBoolean(process.env.AUTO_TRIGGER_PRINT_JOBS, true),
  runMigrationsOnBoot: parseBoolean(process.env.RUN_MIGRATIONS_ON_BOOT, true),
};

module.exports = env;
