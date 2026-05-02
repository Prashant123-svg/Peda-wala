import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import "./OrderManagement.css";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [message, setMessage] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile
        const profileRes = await axios.get("http://localhost:5000/api/auth/profile", {
          const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);

        // Fetch orders based on role
        const ordersRes = await axios.get("http://localhost:5000/api/order-status/dashboard-orders", {
        const ordersRes = await axios.get(`${API_BASE_URL}/order-status/dashboard-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersRes.data.orders);

        // Fetch analytics if admin/subadmin
        if (profileRes.data.role === "admin" || profileRes.data.role === "subAdmin") {
          const analyticsRes = await axios.get(
            "http://localhost:5000/api/order-status/analytics/summary",
            `${API_BASE_URL}/order-status/analytics/summary`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setAnalytics(analyticsRes.data.analytics);

          // Fetch delivery boys for assignment
          const deliveryBoysRes = await axios.get(
            "http://localhost:5000/api/order-status/available-delivery-boys",
            `${API_BASE_URL}/order-status/available-delivery-boys`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setDeliveryBoys(deliveryBoysRes.data.deliveryBoys);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ type: "error", text: "Failed to load orders" });
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleStatusUpdate = async (orderId, newStatus, reason = "") => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/order-status/update-status/${orderId}`,
          `${API_BASE_URL}/order-status/update-status/${orderId}`,
        { newStatus, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: `✅ Order updated to ${newStatus}` });
      
      // Update orders list
      const updatedOrders = orders.map((o) =>
        o._id === orderId ? response.data.order : o
      );
      setOrders(updatedOrders);
      setSelectedOrder(response.data.order);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update order";
      setMessage({ type: "error", text: `❌ ${errorMsg}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAssignDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/order-status/assign-delivery-boy/${orderId}`,
        `${API_BASE_URL}/order-status/assign-delivery-boy/${orderId}`,
        { deliveryBoyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "✅ Delivery boy assigned successfully" });
      
      const updatedOrders = orders.map((o) =>
        o._id === orderId ? response.data.order : o
      );
      setOrders(updatedOrders);
      setSelectedOrder(response.data.order);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to assign delivery boy";
      setMessage({ type: "error", text: `❌ ${errorMsg}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      Processing: "info",
      Shipped: "primary",
      Delivered: "success",
      Cancelled: "danger",
    };
    return colors[status] || "secondary";
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: "🔴 Pending",
      Processing: "🟡 Processing",
      Shipped: "🔵 Shipped",
      Delivered: "🟢 Delivered",
      Cancelled: "⚫ Cancelled",
    };
    return badges[status] || status;
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management">
      {/* Header */}
      <div className="order-header mb-4">
        <h2 className="mb-0">
          <i className="bi bi-bag-check me-2"></i>Order Management
        </h2>
        <p className="text-muted">Role: <strong>{user?.role?.toUpperCase()}</strong></p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${message.type === "success" ? "success" : "danger"} mb-4`}>
          {message.text}
        </div>
      )}

      {/* Analytics Cards (Admin/Sub-admin only) */}
      {analytics && (
        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="analytics-card bg-warning">
              <div className="number">{analytics.pendingOrders}</div>
              <div className="label">Pending</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="analytics-card bg-info">
              <div className="number">{analytics.processingOrders}</div>
              <div className="label">Processing</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="analytics-card bg-primary">
              <div className="number">{analytics.shippedOrders}</div>
              <div className="label">Shipped</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="analytics-card bg-success">
              <div className="number">{analytics.deliveredOrders}</div>
              <div className="label">Delivered</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-4">
        <label className="form-label fw-bold">Filter by Status:</label>
        <div className="btn-group" role="group">
          <button
            className={`btn btn-outline-secondary ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`btn btn-outline-warning ${statusFilter === "Pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("Pending")}
          >
            Pending
          </button>
          <button
            className={`btn btn-outline-info ${statusFilter === "Processing" ? "active" : ""}`}
            onClick={() => setStatusFilter("Processing")}
          >
            Processing
          </button>
          <button
            className={`btn btn-outline-primary ${statusFilter === "Shipped" ? "active" : ""}`}
            onClick={() => setStatusFilter("Shipped")}
          >
            Shipped
          </button>
          <button
            className={`btn btn-outline-success ${statusFilter === "Delivered" ? "active" : ""}`}
            onClick={() => setStatusFilter("Delivered")}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="order-card mb-3 shadow-sm">
              <div
                className="order-header-row d-flex justify-content-between align-items-center p-3 cursor-pointer"
                onClick={() =>
                  setExpandedOrderId(expandedOrderId === order._id ? null : order._id)
                }
              >
                <div className="d-flex gap-3 align-items-center flex-grow-1">
                  <div>
                    <strong>Order ID: {order._id.substring(0, 8)}...</strong>
                    <br />
                    <small className="text-muted">
                      Customer: {order.userId?.name}
                    </small>
                  </div>
                  <span className={`badge bg-${getStatusColor(order.status)}`}>
                    {getStatusBadge(order.status)}
                  </span>
                  <span className="badge bg-secondary">₹{order.totalPrice}</span>
                </div>
                <i
                  className={`bi bi-chevron-down ${
                    expandedOrderId === order._id ? "rotate-180" : ""
                  }`}
                  style={{ transition: "transform 0.3s" }}
                ></i>
              </div>

              {expandedOrderId === order._id && (
                <div className="order-details p-3 border-top">
                  {/* Order Info */}
                  <div className="mb-3 p-3 bg-light rounded">
                    <h6 className="fw-bold mb-2">Order Details</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <small>
                          <strong>Email:</strong> {order.userId?.email}
                        </small>
                        <br />
                        <small>
                          <strong>Phone:</strong> {order.phoneNumber}
                        </small>
                      </div>
                      <div className="col-md-6">
                        <small>
                          <strong>Delivery Address:</strong> {order.deliveryAddress}
                        </small>
                        <br />
                        <small>
                          <strong>Payment Method:</strong> {order.paymentMethod}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">Items ({order.items.length})</h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.qty}</td>
                              <td>₹{item.price}</td>
                              <td>₹{item.price * item.qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Status History */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">Status History</h6>
                    <div className="status-timeline">
                      {order.statusHistory?.map((history, idx) => (
                        <div key={idx} className="timeline-item mb-2">
                          <small className="text-muted">
                            {new Date(history.timestamp).toLocaleString()}
                          </small>
                          <br />
                          <strong>{history.status}</strong>
                          {history.notes && (
                            <>
                              <br />
                              <small className="text-muted">{history.notes}</small>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Update Actions (Role-based) */}
                  <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded">
                    <h6 className="fw-bold mb-2">Update Status</h6>
                    {user?.role === "admin" && (
                      <div className="d-grid gap-2">
                        {order.status === "Pending" && (
                          <>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleStatusUpdate(order._id, "Processing")}
                            >
                              Move to Processing
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === "Processing" && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleStatusUpdate(order._id, "Shipped")}
                            >
                              Mark as Shipped
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === "Shipped" && (
                          <>
                            {!order.deliveryBoyId && (
                              <div className="mb-2">
                                <label className="form-label">Assign Delivery Boy:</label>
                                <select
                                  className="form-select form-select-sm"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignDeliveryBoy(order._id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                >
                                  <option value="">Select a delivery boy</option>
                                  {deliveryBoys.map((db) => (
                                    <option key={db._id} value={db._id}>
                                      {db.name} ({db.phone})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {order.deliveryBoyId && (
                              <small className="text-success">
                                ✅ Assigned to {order.deliveryBoyId?.name}
                              </small>
                            )}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {user?.role === "subAdmin" && (
                      <div className="d-grid gap-2">
                        {order.status === "Pending" && (
                          <>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleStatusUpdate(order._id, "Processing")}
                            >
                              Accept & Move to Processing
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === "Processing" && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleStatusUpdate(order._id, "Shipped")}
                            >
                              Mark as Shipped
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === "Shipped" && (
                          <>
                            {!order.deliveryBoyId && (
                              <div className="mb-2">
                                <label className="form-label">Assign Delivery Boy:</label>
                                <select
                                  className="form-select form-select-sm"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignDeliveryBoy(order._id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                >
                                  <option value="">Select a delivery boy</option>
                                  {deliveryBoys.map((db) => (
                                    <option key={db._id} value={db._id}>
                                      {db.name} ({db.phone})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {order.deliveryBoyId && (
                              <small className="text-success">
                                ✅ Assigned to {order.deliveryBoyId?.name}
                              </small>
                            )}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt("Cancellation reason:");
                                if (reason)
                                  handleStatusUpdate(order._id, "Cancelled", reason);
                              }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {user?.role === "deliveryBoy" && (
                      <div className="d-grid gap-2">
                        {order.status === "Shipped" && order.deliveryBoyId?._id === user._id && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleStatusUpdate(order._id, "Delivered")}
                          >
                            Mark as Delivered
                          </button>
                        )}
                        {order.status !== "Shipped" && (
                          <small className="text-muted">
                            No actions available for this order
                          </small>
                        )}
                      </div>
                    )}

                    {user?.role === "user" && (
                      <small className="text-muted">
                        You can only view your order. Contact support for changes.
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
