const { DEPARTMENTS } = require("../constants/departments");

function normalizeDepartment(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  if (normalized === "CONFECTIONERY") {
    return DEPARTMENTS.CONFECTIONERY;
  }
  if (normalized === "DM") {
    return DEPARTMENTS.DM;
  }
  if (normalized === "DESIGN") {
    return DEPARTMENTS.DESIGN;
  }
  return null;
}

function statusColumnForDepartment(department) {
  switch (department) {
    case DEPARTMENTS.DM:
      return "dm_status";
    case DEPARTMENTS.CONFECTIONERY:
      return "confectionery_status";
    case DEPARTMENTS.DESIGN:
      return "design_status";
    default:
      return null;
  }
}

function pdfColumnForDepartment(department) {
  switch (department) {
    case DEPARTMENTS.DM:
      return "dm_pdf_path";
    case DEPARTMENTS.CONFECTIONERY:
      return "confectionery_pdf_path";
    case DEPARTMENTS.DESIGN:
      return "design_pdf_path";
    default:
      return null;
  }
}

module.exports = {
  normalizeDepartment,
  statusColumnForDepartment,
  pdfColumnForDepartment,
};
