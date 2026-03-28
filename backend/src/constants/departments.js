const DEPARTMENTS = Object.freeze({
  DM: "DM",
  CONFECTIONERY: "CONFECTIONERY",
  DESIGN: "DESIGN",
});

const DEPARTMENT_LIST = Object.freeze(Object.values(DEPARTMENTS));

module.exports = {
  DEPARTMENTS,
  DEPARTMENT_LIST,
};
