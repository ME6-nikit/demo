import React, { useEffect, useMemo, useState } from "react";
import { api, downloadDepartmentPdf } from "./api";

const MAIN_TABS = {
  ORDER_LISTING: "Order Listing",
  OMA: "Order Management Automation",
  SETTINGS: "Settings",
};

const OMA_TABS = {
  ACTION_REQUIRED: "Action Required",
  ALL_ORDERS: "All Orders",
};

const DEPARTMENTS = [
  { label: "DM", backendDepartment: "DM", statusField: "dm_status", pdfField: "dm_pdf_path", key: "dm" },
  {
    label: "Confectionery",
    backendDepartment: "Confectionery",
    statusField: "confectionery_status",
    pdfField: "confectionery_pdf_path",
    key: "confectionery",
  },
  {
    label: "Design",
    backendDepartment: "Design",
    statusField: "design_status",
    pdfField: "design_pdf_path",
    key: "design",
  },
];

function canDownload(status) {
  return status && status !== "NA";
}

function StatusTag({ status }) {
  const cls =
    status === "Success"
      ? "tag success"
      : status === "Failure"
        ? "tag failure"
        : status === "In-Progress"
          ? "tag progress"
          : status === "NA"
            ? "tag na"
            : "tag pending";
  return <span className={cls}>{status || "-"}</span>;
}

function getPrintableDepartments(row) {
  return DEPARTMENTS.filter(
    (department) => row[department.statusField] !== "NA" && Boolean(row[department.pdfField])
  );
}

function getDefaultActivePrintOption(row) {
  const priority = {
    "In-Progress": 0,
    Pending: 1,
    Failure: 2,
    Success: 3,
  };
  const candidates = getPrintableDepartments(row);
  if (!candidates.length) return "";
  const sorted = [...candidates].sort((left, right) => {
    const leftPriority = priority[row[left.statusField]] ?? 99;
    const rightPriority = priority[row[right.statusField]] ?? 99;
    return leftPriority - rightPriority;
  });
  // The first candidate becomes the row's active print option.
  return sorted[0].key;
}

function OrdersTable({
  rows,
  showIgnore,
  showPrint,
  activePrintOptionByOrder,
  printStateByOrder,
  onChangeActivePrintOption,
  onPrint,
  onIgnore,
  onTimeline,
}) {
  return (
    <table className="oma-table">
      <thead>
        <tr>
          <th>Order Number</th>
          <th>Customer Name</th>
          <th>Delivery Date</th>
          <th>DM Status</th>
          <th>DM Download</th>
          <th>Confectionery Status</th>
          <th>Confectionery Download</th>
          <th>Design Status</th>
          <th>Design Download</th>
          <th>Last Updated</th>
          <th>Timeline</th>
          {showPrint && <th>Print</th>}
          {showIgnore && <th>Ignore Order</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.order_id}>
            <td>{row.order_number}</td>
            <td>{row.customer_name}</td>
            <td>{row.delivery_date || "-"}</td>
            {DEPARTMENTS.map((dept) => (
              <React.Fragment key={`${row.order_id}-${dept.key}`}>
                <td>
                  <StatusTag status={row[dept.statusField]} />
                </td>
                <td>
                  <a
                    href={downloadDepartmentPdf(row.order_id, dept.key)}
                    target="_blank"
                    rel="noreferrer"
                    className={`link-btn ${canDownload(row[dept.statusField]) ? "" : "disabled"}`}
                    onClick={(e) => {
                      if (!canDownload(row[dept.statusField])) e.preventDefault();
                    }}
                  >
                    Download
                  </a>
                </td>
              </React.Fragment>
            ))}
            <td>{row.updated_at}</td>
            <td>
              <button className="small-btn" onClick={() => onTimeline(row.order_id)}>
                View
              </button>
            </td>
            {showPrint && (
              <td>
                <div className="print-controls">
                  <select
                    value={activePrintOptionByOrder[row.order_id] || ""}
                    onChange={(event) =>
                      onChangeActivePrintOption(row.order_id, event.target.value)
                    }
                    className="small-select"
                  >
                    {getPrintableDepartments(row).length === 0 && (
                      <option value="">No active option</option>
                    )}
                    {getPrintableDepartments(row).map((department) => (
                      <option key={department.key} value={department.key}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="small-btn"
                    disabled={
                      !activePrintOptionByOrder[row.order_id] ||
                      printStateByOrder[row.order_id]?.loading
                    }
                    onClick={() => onPrint(row)}
                  >
                    {printStateByOrder[row.order_id]?.loading ? "Printing..." : "Print"}
                  </button>
                  {printStateByOrder[row.order_id]?.error && (
                    <div className="status-text error">
                      {printStateByOrder[row.order_id].error}
                    </div>
                  )}
                  {printStateByOrder[row.order_id]?.success && (
                    <div className="status-text success">
                      {printStateByOrder[row.order_id].success}
                    </div>
                  )}
                </div>
              </td>
            )}
            {showIgnore && (
              <td>
                <button className="small-btn warn" onClick={() => onIgnore(row.order_id)}>
                  Ignore
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function App() {
  const [mainTab, setMainTab] = useState(MAIN_TABS.OMA);
  const [omaTab, setOmaTab] = useState(OMA_TABS.ACTION_REQUIRED);
  const [actionRequiredOrders, setActionRequiredOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [timelineOrderId, setTimelineOrderId] = useState("");
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePrintOptionByOrder, setActivePrintOptionByOrder] = useState({});
  const [printStateByOrder, setPrintStateByOrder] = useState({});

  const departmentAssignments = useMemo(() => {
    return {
      DM: printers.find((p) => p.assigned_department === "DM")?.printer_name || "-",
      Confectionery:
        printers.find((p) => p.assigned_department === "Confectionery")?.printer_name || "-",
      Design: printers.find((p) => p.assigned_department === "Design")?.printer_name || "-",
    };
  }, [printers]);

  async function loadOrders() {
    setLoading(true);
    try {
      const [actionRes, allRes] = await Promise.all([
        api.get("/api/orders", { params: { actionRequired: true } }),
        api.get("/api/orders", { params: { actionRequired: false } }),
      ]);
      setActionRequiredOrders(actionRes.data.orders || []);
      const allOrderRows = allRes.data.orders || [];
      setAllOrders(allOrderRows);
      setActivePrintOptionByOrder((previous) => {
        const next = { ...previous };
        for (const order of allOrderRows) {
          const orderId = order.order_id;
          const currentOption = next[orderId];
          const isCurrentOptionStillValid = getPrintableDepartments(order).some(
            (department) => department.key === currentOption
          );
          if (!isCurrentOptionStillValid) {
            next[orderId] = getDefaultActivePrintOption(order);
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPrinters() {
    const res = await api.get("/api/printers");
    setPrinters(res.data.printers || []);
  }

  async function handleIgnore(orderId) {
    await api.patch(`/api/orders/${orderId}/ignore`, { ignored: true });
    await loadOrders();
  }

  async function handleTimeline(orderId) {
    const res = await api.get(`/api/orders/${orderId}/timeline`);
    setTimeline(res.data.timeline || []);
    setTimelineOrderId(orderId);
  }

  async function handlePrinterToggle(printer) {
    await api.patch(`/api/printers/${printer.printer_id}`, {
      is_active: !printer.is_active,
    });
    await loadPrinters();
  }

  async function handleDepartmentAssign(printerId, department) {
    await api.patch(`/api/printers/${printerId}`, {
      assigned_department: department || null,
    });
    await loadPrinters();
  }

  function handleChangeActivePrintOption(orderId, option) {
    setActivePrintOptionByOrder((previous) => ({
      ...previous,
      [orderId]: option,
    }));
    setPrintStateByOrder((previous) => ({
      ...previous,
      [orderId]: {
        loading: false,
        error: "",
        success: "",
      },
    }));
  }

  async function handlePrintOrder(order) {
    const orderId = order.order_id;
    const selectedOption = activePrintOptionByOrder[orderId];
    const selectedDepartment = DEPARTMENTS.find((department) => department.key === selectedOption);

    if (!selectedDepartment) {
      setPrintStateByOrder((previous) => ({
        ...previous,
        [orderId]: {
          loading: false,
          error: "No active print option selected for this order.",
          success: "",
        },
      }));
      return;
    }

    const assignedPrinter = printers.find(
      (printer) =>
        printer.assigned_department === selectedDepartment.backendDepartment &&
        Boolean(printer.is_active) &&
        String(printer.status || "").toLowerCase() === "online"
    );
    if (!assignedPrinter) {
      setPrintStateByOrder((previous) => ({
        ...previous,
        [orderId]: {
          loading: false,
          error: `No active online printer assigned for ${selectedDepartment.label}.`,
          success: "",
        },
      }));
      return;
    }

    const pdfPath = order[selectedDepartment.pdfField];
    if (!pdfPath) {
      setPrintStateByOrder((previous) => ({
        ...previous,
        [orderId]: {
          loading: false,
          error: `No ${selectedDepartment.label} PDF path available.`,
          success: "",
        },
      }));
      return;
    }

    setPrintStateByOrder((previous) => ({
      ...previous,
      [orderId]: {
        loading: true,
        error: "",
        success: "",
      },
    }));

    try {
      // Only one explicitly selected department is sent to the print API.
      await api.post("/api/print-job", {
        order_id: orderId,
        department: selectedDepartment.backendDepartment,
        printer_id: assignedPrinter.printer_id,
        pdf_path: pdfPath,
      });
      setPrintStateByOrder((previous) => ({
        ...previous,
        [orderId]: {
          loading: false,
          error: "",
          success: `Queued ${selectedDepartment.label} print.`,
        },
      }));
      await loadOrders();
    } catch (error) {
      setPrintStateByOrder((previous) => ({
        ...previous,
        [orderId]: {
          loading: false,
          error: error.response?.data?.message || "Failed to queue print job.",
          success: "",
        },
      }));
    }
  }

  useEffect(() => {
    loadOrders();
    loadPrinters();
  }, []);

  return (
    <div className="page">
      <h1>Order Management Automation (OMA)</h1>
      <div className="tabs">
        {Object.values(MAIN_TABS).map((tab) => (
          <button
            key={tab}
            className={`tab ${mainTab === tab ? "active" : ""}`}
            onClick={() => setMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {mainTab === MAIN_TABS.ORDER_LISTING && (
        <section className="panel">
          <h2>Order Listing</h2>
          <p>Existing order listing placeholder.</p>
        </section>
      )}

      {mainTab === MAIN_TABS.OMA && (
        <section className="panel">
          <div className="tabs">
            {Object.values(OMA_TABS).map((tab) => (
              <button
                key={tab}
                className={`tab ${omaTab === tab ? "active" : ""}`}
                onClick={() => setOmaTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading && <p>Loading orders...</p>}
          {!loading && omaTab === OMA_TABS.ACTION_REQUIRED && (
            <OrdersTable
              rows={actionRequiredOrders}
              showIgnore
              showPrint={false}
              activePrintOptionByOrder={{}}
              printStateByOrder={{}}
              onChangeActivePrintOption={() => {}}
              onPrint={() => {}}
              onIgnore={handleIgnore}
              onTimeline={handleTimeline}
            />
          )}
          {!loading && omaTab === OMA_TABS.ALL_ORDERS && (
            <OrdersTable
              rows={allOrders}
              showIgnore={false}
              showPrint
              activePrintOptionByOrder={activePrintOptionByOrder}
              printStateByOrder={printStateByOrder}
              onChangeActivePrintOption={handleChangeActivePrintOption}
              onPrint={handlePrintOrder}
              onTimeline={handleTimeline}
            />
          )}
        </section>
      )}

      {mainTab === MAIN_TABS.SETTINGS && (
        <section className="panel">
          <h2>Settings → Configuration</h2>
          <h3>Printer Management</h3>
          <table className="oma-table">
            <thead>
              <tr>
                <th>Printer Name</th>
                <th>Printer ID</th>
                <th>Machine ID</th>
                <th>Status</th>
                <th>Active</th>
                <th>Assigned Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {printers.map((printer) => (
                <tr key={printer.printer_id}>
                  <td>{printer.printer_name}</td>
                  <td>{printer.printer_id}</td>
                  <td>{printer.machine_id}</td>
                  <td>{printer.status}</td>
                  <td>{printer.is_active ? "Yes" : "No"}</td>
                  <td>
                    <select
                      value={printer.assigned_department || ""}
                      onChange={(e) =>
                        handleDepartmentAssign(printer.printer_id, e.target.value || null)
                      }
                    >
                      <option value="">Unassigned</option>
                      <option value="DM">DM</option>
                      <option value="Confectionery">Confectionery</option>
                      <option value="Design">Design</option>
                    </select>
                  </td>
                  <td>
                    <button className="small-btn" onClick={() => handlePrinterToggle(printer)}>
                      {printer.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Department Printer Assignment</h3>
          <ul>
            <li>DM: {departmentAssignments.DM}</li>
            <li>Confectionery: {departmentAssignments.Confectionery}</li>
            <li>Design: {departmentAssignments.Design}</li>
          </ul>
        </section>
      )}

      {timelineOrderId && (
        <section className="panel">
          <h3>Timeline — Order {timelineOrderId}</h3>
          <button className="small-btn" onClick={() => setTimelineOrderId("")}>
            Close
          </button>
          <ul>
            {timeline.map((row) => (
              <li key={row.id}>
                [{row.timestamp}] {row.event_type} / {row.status || "-"} / {row.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;
