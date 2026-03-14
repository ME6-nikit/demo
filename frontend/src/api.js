import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
});

export function downloadDepartmentPdf(orderId, department) {
  return `${baseURL}/api/orders/${orderId}/department/${department}/download-pdf`;
}
