const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { pdfRoot } = require("../config/env");
const { Department, DepartmentStatus } = require("../utils/constants");
const { ensureDirSync } = require("../utils/fs");

function writePdf(filePath, buildContent) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    buildContent(doc);
    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

function buildTicket(order, department) {
  return (doc) => {
    doc.fontSize(18).text(`OMA Department Ticket - ${department}`);
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.order_id}`);
    doc.text(`Order Number: ${order.order_number || "-"}`);
    doc.text(`Customer: ${order.customer_name || "-"}`);
    doc.text(`Delivery Date: ${order.delivery_date || "-"}`);
    doc.text(`Delivery Time: ${order.delivery_time || "-"}`);
    doc.text(`Shipping Method: ${order.shipping_method || "-"}`);
    doc.moveDown();
    doc.text("Items:");
    (order.items || []).forEach((item, index) => {
      const title = item.title || item.name || "Untitled";
      const qty = item.quantity || 1;
      doc.text(`${index + 1}. ${title} x ${qty}`);
    });
    doc.moveDown();
    doc.text(`Generated At: ${new Date().toISOString()}`);
  };
}

function fileName(orderId, department) {
  return `${orderId}-${department.toLowerCase()}-${Date.now()}.pdf`;
}

async function generateDepartmentPdfs(order, statuses) {
  ensureDirSync(pdfRoot);

  const departmentMap = {
    [Department.DM]: "dm_pdf_path",
    [Department.CONFECTIONERY]: "confectionery_pdf_path",
    [Department.DESIGN]: "design_pdf_path",
  };

  const output = {
    dm_pdf_path: null,
    confectionery_pdf_path: null,
    design_pdf_path: null,
  };

  for (const [department, fieldName] of Object.entries(departmentMap)) {
    const status = statuses[department]?.status;
    if (status === DepartmentStatus.NA) continue;
    const dir = path.join(pdfRoot, order.order_id);
    ensureDirSync(dir);
    const fullPath = path.join(dir, fileName(order.order_id, department));
    // Department-specific ticket data is generated separately for traceability.
    await writePdf(fullPath, buildTicket(order, department));
    output[fieldName] = fullPath;
  }

  return output;
}

module.exports = {
  generateDepartmentPdfs,
};
