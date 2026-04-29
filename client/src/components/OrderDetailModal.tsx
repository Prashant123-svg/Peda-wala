import React, { useState, useEffect } from "react";
import "./OrderDetailModal.css";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderDetailData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: string;
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  order: OrderDetailData | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDeleteOrder: (orderId: string) => void;
  statusUpdateLoading: string | null;
  deleteLoading: string | null;
}

const statusColors: { [key: string]: string } = {
  Pending: "warning",
  Processing: "info",
  Shipped: "primary",
  Delivered: "success",
  Cancelled: "danger",
};

// Helper function to get breakpoint name
const getBreakpoint = (width: number): string => {
  if (width <= 480) return "XS (Mobile)";
  if (width <= 600) return "SM (Phone)";
  if (width <= 768) return "MD (Tablet)";
  if (width <= 1024) return "LG (Small Desktop)";
  if (width <= 1440) return "XL (Desktop)";
  return "XXL (Large Desktop)";
};

// Helper function to get grid columns
const getGridColumns = (width: number): string => {
  if (width <= 600) return "1 Column";
  if (width <= 768) return "2 Columns";
  if (width <= 1024) return "2 Columns";
  if (width <= 1440) return "2 Columns";
  return "3 Columns";
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  order,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  statusUpdateLoading,
  deleteLoading,
}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  if (!isOpen || !order) return null;

  return (
    <div className="order-detail-modal-overlay" onClick={onClose}>
      <div
        className="order-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <i className="bi bi-box-seam me-2"></i>Order Details
            </h3>
            <small className="text-muted">
              Order ID: {order._id.slice(0, 12)}...
            </small>
          </div>
          <button className="btn-close" onClick={onClose} title="Close modal">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Dimension Info Display */}
          <div
            style={{
              backgroundColor: "#f0f4ff",
              border: "1px solid #d0d8ff",
              borderRadius: "6px",
              padding: "8px 12px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#555",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              <strong>Screen:</strong> {windowSize.width}×{windowSize.height}px
            </span>
            <span>
              <strong>Breakpoint:</strong> {getBreakpoint(windowSize.width)}
            </span>
            <span>
              <strong style={{ color: "#667eea" }}>📊 Grid:</strong>{" "}
              <span
                style={{
                  backgroundColor: "#667eea",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  display: "inline-block",
                  marginLeft: "4px",
                }}
              >
                {getGridColumns(windowSize.width)}
              </span>
            </span>
          </div>

          {/* Order Status */}
          <div className="status-badge-container">
            <span
              className={`badge bg-${
                statusColors[order.status] || "secondary"
              } status-badge`}
            >
              {order.status}
            </span>
            <small className="text-muted ms-2">
              Ordered: {new Date(order.createdAt).toLocaleDateString()}
            </small>
          </div>

          {/* Customer Info */}
          <div className="section customer-section">
            <h5 className="section-title">
              <i className="bi bi-person me-2"></i>Customer Information
            </h5>
            <div className="customer-info">
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{order.userId.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Email</span>
                <span className="value">{order.userId.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone</span>
                <span className="value">{order.phoneNumber || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="section">
            <h5 className="section-title">
              <i className="bi bi-geo-alt me-2"></i>Delivery Address
            </h5>
            <div className="address-box">
              {order.deliveryAddress}
            </div>
          </div>

          {/* Order Items */}
          <div className="section">
            <h5 className="section-title">
              <i className="bi bi-basket me-2"></i>Order Items ({order.items.length})
            </h5>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-card">
                  {item.image && (
                    <div className="item-image">
                      <img src={item.image} alt={item.productName} />
                    </div>
                  )}
                  <div className="item-details">
                    <div className="item-name">{item.productName}</div>
                    <div className="item-info">
                      <span className="quantity">Qty: {item.quantity}</span>
                      <span className="price">₹{item.price}</span>
                    </div>
                  </div>
                  <div className="item-subtotal">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="section">
            <h5 className="section-title">
              <i className="bi bi-receipt me-2"></i>Order Summary
            </h5>
            <div className="summary-box">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{order.totalPrice}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{order.totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="section">
            <h5 className="section-title">
              <i className="bi bi-pencil me-2"></i>Update Status
            </h5>
            <label htmlFor="status-update" className="form-label">
              Order Status
            </label>
            <select
              id="status-update"
              className="form-select"
              value={order.status}
              onChange={(e) => onUpdateStatus(order._id, e.target.value)}
              disabled={statusUpdateLoading === order._id}
              title="Update order status"
            >
              <option value="">Select Status</option>
              {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                )
              )}
            </select>
            {statusUpdateLoading === order._id && (
              <small className="text-info">
                <i className="bi bi-hourglass-split me-2"></i>Updating...
              </small>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={() => onDeleteOrder(order._id)}
            disabled={deleteLoading === order._id}
            className="btn btn-danger"
          >
            {deleteLoading === order._id ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>Delete Order
              </>
            )}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
