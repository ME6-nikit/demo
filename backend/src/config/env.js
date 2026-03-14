const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const storageRoot = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");

module.exports = {
  port: Number(process.env.PORT || 4000),
  mysql: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "oma",
  },
  shopifyWebhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || "",
  storageRoot,
  pdfRoot: process.env.PDF_ROOT || path.join(storageRoot, "pdfs"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",
  allowedDepartments: ["DM", "Confectionery", "Design"],
};
