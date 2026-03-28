const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const PDFDocument = require("pdfkit");
const env = require("../config/env");

async function ensurePdfDirectory() {
  await fsp.mkdir(env.pdfStorageDir, { recursive: true });
}

function createSafeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9-_]/g, "_");
}

function extractLineItems(rawPayload) {
  if (!rawPayload) return [];
  let payload = rawPayload;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (_e) { return []; }
  }
  return (payload.line_items || []).map((item) => ({
    title: item.title || item.name || "Unnamed Item",
    quantity: item.quantity || 1,
    price: item.price || "0.00",
    sku: item.sku || "",
    variant_title: item.variant_title || "",
    properties: item.properties || [],
  }));
}

function formatCurrency(amount) {
  return parseFloat(amount || 0).toFixed(2);
}

function drawHeader(doc, department) {
  doc.fontSize(18).font("Helvetica-Bold").text("ORDER MANAGEMENT AUTOMATION", { align: "center" });
  doc.moveDown(0.3);

  doc.fontSize(14).font("Helvetica-Bold").text(`Department: ${department}`, { align: "center" });
  doc.moveDown(0.5);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function drawOrderInfo(doc, order) {
  const labelFont = "Helvetica-Bold";
  const valueFont = "Helvetica";
  const leftCol = 50;

  function drawField(x, label, value) {
    const y = doc.y;
    doc.font(labelFont).fontSize(10).text(`${label}:`, x, y, { continued: true });
    doc.font(valueFont).text(` ${value || "N/A"}`);
  }

  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString("en-GB")
    : "N/A";
  const orderDate = order.order_date
    ? new Date(order.order_date).toLocaleString("en-GB")
    : "N/A";

  drawField(leftCol, "Order Number", order.order_number);
  drawField(leftCol, "Shopify Order ID", order.order_id);
  drawField(leftCol, "Customer", order.customer_name || "N/A");
  drawField(leftCol, "Order Date", orderDate);
  drawField(leftCol, "Delivery Date", deliveryDate);
  drawField(leftCol, "Delivery Time", order.specific_delivery_time || order.delivery_time || "N/A");
  drawField(leftCol, "Shipping Method", order.shipping_method || "N/A");
  if (order.reserved) {
    drawField(leftCol, "Reserved", "Yes");
  }

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function drawLineItemsTable(doc, lineItems) {
  doc.font("Helvetica-Bold").fontSize(12).text("Line Items");
  doc.moveDown(0.3);

  if (lineItems.length === 0) {
    doc.font("Helvetica-Oblique").fontSize(10).text("  No line items available.");
    doc.moveDown(0.5);
    return;
  }

  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 60;
  const col3 = 340;
  const col4 = 400;
  const col5 = 470;

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("#", col1, tableTop, { width: 15 });
  doc.text("Item", col2, tableTop, { width: 275 });
  doc.text("Qty", col3, tableTop, { width: 50 });
  doc.text("Price", col4, tableTop, { width: 60 });
  doc.text("Total", col5, tableTop, { width: 70 });

  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).stroke();
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(9);

  lineItems.forEach((item, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }

    const y = doc.y;
    const itemTotal = formatCurrency(parseFloat(item.price) * item.quantity);
    const variant = item.variant_title ? ` (${item.variant_title})` : "";

    doc.text(`${index + 1}`, col1, y, { width: 15 });
    doc.text(`${item.title}${variant}`, col2, y, { width: 275 });
    doc.text(`${item.quantity}`, col3, y, { width: 50 });
    doc.text(`$${formatCurrency(item.price)}`, col4, y, { width: 60 });
    doc.text(`$${itemTotal}`, col5, y, { width: 70 });

    if (item.properties && item.properties.length > 0) {
      item.properties.forEach((prop) => {
        if (prop.name && prop.value && !prop.name.startsWith("_")) {
          doc.font("Helvetica-Oblique").fontSize(8)
            .text(`  ${prop.name}: ${prop.value}`, col2 + 10, doc.y, { width: 265 });
        }
      });
      doc.font("Helvetica").fontSize(9);
    }

    doc.moveDown(0.2);
  });

  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function drawDepartmentNotes(doc, department) {
  doc.font("Helvetica-Bold").fontSize(11).text("Department Instructions");
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10);

  switch (department) {
    case "DM":
      doc.text("This order requires Dispatch Management processing.");
      doc.text("Please verify delivery details, packaging, and shipping labels.");
      break;
    case "CONFECTIONERY":
      doc.text("This order includes confectionery items.");
      doc.text("Please prepare all confectionery items as per order specifications.");
      doc.text("Check for any special dietary requirements or customization notes.");
      break;
    case "DESIGN":
      doc.text("This order includes custom design work.");
      doc.text("Please review the design specifications and customer preferences.");
      doc.text("Ensure design approval before proceeding with production.");
      break;
    default:
      doc.text("Standard processing required.");
  }

  doc.moveDown(0.5);
}

function drawFooter(doc) {
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font("Helvetica-Oblique").fontSize(8)
    .text(`Generated: ${new Date().toISOString()}`, { align: "right" });
  doc.text("OMA - Order Management Automation System", { align: "right" });
}

async function generateDepartmentPdf(order, department) {
  await ensurePdfDirectory();

  const fileName = `${createSafeFileName(order.order_number)}_${department}_${Date.now()}.pdf`;
  const absolutePath = path.join(env.pdfStorageDir, fileName);

  const lineItems = extractLineItems(order.raw_payload);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    drawHeader(doc, department);
    drawOrderInfo(doc, order);
    drawDepartmentNotes(doc, department);
    drawLineItemsTable(doc, lineItems);
    drawFooter(doc);

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
  });

  const relativePath = path.relative(process.cwd(), absolutePath);
  return {
    absolutePath,
    relativePath,
  };
}

module.exports = {
  generateDepartmentPdf,
};
