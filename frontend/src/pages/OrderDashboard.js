import React, { useEffect, useState } from "react";
import { fetchOrders } from "../services/api";

const STATUS_COLORS = {
  NA: "#9e9e9e",
  PENDING: "#ff9800",
  "IN-PROGRESS": "#2196f3",
  SUCCESS: "#4caf50",
  FAILED: "#f44336",
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: STATUS_COLORS[status] || "#9e9e9e",
      }}
    >
      {status}
    </span>
  );
}

function OrderDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("action_required");

  useEffect(() => {
    setLoading(true);
    fetchOrders({ view })
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [view]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Order Management Automation</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Department-wise order tracking and print management
      </p>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setView("action_required")}
          style={{
            padding: "8px 16px",
            marginRight: 8,
            fontWeight: view === "action_required" ? 700 : 400,
            backgroundColor: view === "action_required" ? "#1976d2" : "#e0e0e0",
            color: view === "action_required" ? "#fff" : "#333",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Action Required
        </button>
        <button
          onClick={() => setView("all")}
          style={{
            padding: "8px 16px",
            fontWeight: view === "all" ? 700 : 400,
            backgroundColor: view === "all" ? "#1976d2" : "#e0e0e0",
            color: view === "all" ? "#fff" : "#333",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          All Orders
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#999" }}>No orders found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Order #</th>
              <th style={{ padding: 8 }}>Customer</th>
              <th style={{ padding: 8 }}>Delivery Date</th>
              <th style={{ padding: 8 }}>DM</th>
              <th style={{ padding: 8 }}>Confectionery</th>
              <th style={{ padding: 8 }}>Design</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 600 }}>
                  {order.orderNumber}
                </td>
                <td style={{ padding: 8 }}>{order.customerName}</td>
                <td style={{ padding: 8 }}>
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: 8 }}>
                  <StatusBadge status={order.departments.DM.status} />
                </td>
                <td style={{ padding: 8 }}>
                  <StatusBadge
                    status={order.departments.CONFECTIONERY.status}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <StatusBadge status={order.departments.DESIGN.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrderDashboard;
