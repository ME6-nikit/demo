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
  { label: "DM", statusField: "dm_status", key: "dm" },
  { label: "Confectionery", statusField: "confectionery_status", key: "confectionery" },
  { label: "Design", statusField: "design_status", key: "design" },
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

function OrdersTable({ rows, showIgnore, onIgnore, onTimeline }) {
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
      setAllOrders(allRes.data.orders || []);
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
              onIgnore={handleIgnore}
              onTimeline={handleTimeline}
            />
          )}
          {!loading && omaTab === OMA_TABS.ALL_ORDERS && (
            <OrdersTable rows={allOrders} showIgnore={false} onTimeline={handleTimeline} />
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
