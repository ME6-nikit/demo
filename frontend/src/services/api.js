import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 15000,
});

export function fetchOrders(params = {}) {
  return api.get("/orders", { params });
}

export function fetchOrderById(orderId) {
  return api.get(`/orders/${orderId}`);
}

export function fetchOrderTimeline(orderId) {
  return api.get(`/orders/${orderId}/timeline`);
}

export function ignoreOrder(orderId, isIgnored) {
  return api.patch(`/orders/${orderId}/ignore`, { isIgnored });
}

export function retryDepartmentPrint(orderId, department) {
  return api.post(`/orders/${orderId}/department/${department}/retry`);
}

export function downloadDepartmentPdf(orderId, department) {
  return api.get(`/orders/${orderId}/department/${department}/download-pdf`, {
    responseType: "blob",
  });
}

export function fetchPrinters() {
  return api.get("/printers");
}

export function fetchPrinterAssignments() {
  return api.get("/printers/assignments");
}

export function assignPrinter(department, printerId, machineId) {
  return api.post("/printers/assignments", { department, printerId, machineId });
}

export default api;
