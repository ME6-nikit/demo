import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
});

export function departmentPdfApiPath(orderId, department) {
  return `/api/orders/${orderId}/department/${department}/download-pdf`;
}

export function downloadDepartmentPdf(orderId, department) {
  return `${baseURL}${departmentPdfApiPath(orderId, department)}`;
}

export async function fetchDepartmentPdfBlob(orderId, department) {
  const response = await api.get(departmentPdfApiPath(orderId, department), {
    responseType: "blob",
  });
  return response.data;
}
