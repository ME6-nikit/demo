const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const shopifyRoutes = require("./routes/shopifyRoutes");
const orderRoutes = require("./routes/orderRoutes");
const printerRoutes = require("./routes/printerRoutes");
const printJobRoutes = require("./routes/printJobRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "oma-backend",
    timestamp: new Date().toISOString(),
  });
});

// Raw body is required for Shopify HMAC signature verification.
app.use("/api/webhooks/shopify", shopifyRoutes);
app.use("/api/shopify/webhook", shopifyRoutes);
app.use("/api/shopify", shopifyRoutes);

app.use(express.json({ limit: "5mb" }));

app.use("/api/orders", orderRoutes);
app.use("/api/printers", printerRoutes);
app.use("/api/print-job", printJobRoutes);
app.use("/api/print-jobs", printJobRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
