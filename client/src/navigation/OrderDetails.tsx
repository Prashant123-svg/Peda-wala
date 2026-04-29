import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  qty: number;
  productId?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  deliveryAddress: string;
  phoneNumber: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      if (!token) {
        setError("Please login to view order details");
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.DEV
        ? `http://localhost:5000/api/orders/order/${orderId}`
        : `/api/orders/order/${orderId}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      setError("");
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning text-dark";
      case "Shipped":
        return "bg-info text-white";
      case "Delivered":
        return "bg-success text-white";
      case "Cancelled":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Shipped":
        return "🚚";
      case "Delivered":
        return "✅";
      case "Cancelled":
        return "❌";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-6 text-center">
        <div className="spinner-border text-warning" role="status"></div>
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full px-4 py-6">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error || "Order not found"}</p>
          <hr />
          <button
            onClick={() => navigate("/orders")}
            className="btn btn-warning"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const fallbackImg = "/images/placeholder.jpg";

  const getImageUrl = (image: string | undefined): string => {
    if (!image) return fallbackImg;
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  return (
    <div className="order-detail-page page-section">
      <div className="w-full px-4 py-6 section-content">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/orders")}
          className="btn btn-outline-warning mb-3"
        >
          ← Back to Orders
        </button>
        <h1 className="mb-2 text-center-content" style={{ color: "#FFC107", fontSize: "2.5rem" }}>
          {getStatusIcon(order.status)} Order Details
        </h1>
        <p className="text-muted text-center">Order ID: {order._id}</p>
      </div>

      {/* Order Status */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div className="row align-items-center content-wrapper-between">
          <div className="col-md-6">
            <h5 style={{ color: "#111827", marginBottom: "10px" }}>Order Status</h5>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${getStatusColor(order.status)} fs-6`}>
                {order.status}
              </span>
            </div>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "10px" }}>
              <strong>Ordered on:</strong> {new Date(order.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="col-md-6 text-center">
            <p style={{ color: "#111827", marginBottom: "0" }}>
              <strong style={{ fontSize: "1.5rem" }}>Total Amount</strong>
            </p>
            <p style={{ color: "#FFC107", fontSize: "2rem", fontWeight: "bold", marginBottom: "0" }}>
              ₹{order.totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h5 style={{ color: "#FFC107", marginBottom: "20px" }}>📦 Order Items</h5>
        <div className="row g-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="col-12">
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  gap: "16px",
                }}
              >
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
                <div style={{ flex: 1 }}>
                  <h6 style={{ color: "#111827", marginBottom: "8px" }}>
                    {item.name}
                  </h6>
                  <p style={{ color: "#6b7280", marginBottom: "8px" }}>
                    <strong>Price per unit:</strong> ₹{item.price.toFixed(2)}
                  </p>
                  <p style={{ color: "#6b7280", marginBottom: "8px" }}>
                    <strong>Quantity:</strong> {item.qty}
                  </p>
                  <p style={{ color: "#FFC107", fontWeight: "bold", marginBottom: "0" }}>
                    Subtotal: ₹{(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h5 style={{ color: "#FFC107", marginBottom: "16px" }}>
              📍 Delivery Address
            </h5>
            <div style={{ color: "#111827", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "12px", fontSize: "1.1rem", fontWeight: "500" }}>
                {order.deliveryAddress || "Address not provided"}
              </p>
              <p style={{ color: "#6b7280", marginBottom: "0" }}>
                <strong>📞 Phone:</strong> {order.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="col-md-6">
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h5 style={{ color: "#FFC107", marginBottom: "16px" }}>
              💳 Payment Information
            </h5>
            <div style={{ color: "#111827", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "12px" }}>
                <strong>Payment Method:</strong>{" "}
                <span style={{ color: "#FFC107" }}>
                  {order.paymentMethod || "COD"}
                </span>
              </p>
              <p style={{ color: "#6b7280", marginBottom: "0" }}>
                <strong>Total Amount:</strong> ₹{order.totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h5 style={{ color: "#FFC107", marginBottom: "16px" }}>📋 Order Summary</h5>
        <div style={{ color: "#111827" }}>
          <div className="d-flex justify-content-between mb-2">
            <span>Subtotal ({order.items.length} items):</span>
            <span>₹{order.totalPrice.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2" style={{ color: "#6b7280" }}>
            <span>Delivery Charges:</span>
            <span>FREE</span>
          </div>
          <hr style={{ borderColor: "#e5e7eb", margin: "12px 0" }} />
          <div className="d-flex justify-content-between" style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#FFC107" }}>
            <span>Total Amount:</span>
            <span>₹{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex gap-2 justify-content-center">
        <button
          onClick={() => navigate("/orders")}
          className="btn btn-warning"
          style={{ fontWeight: "600", padding: "10px 30px" }}
        >
          ← Back to Orders
        </button>
        <button
          onClick={() => navigate("/")}
          className="btn btn-outline-warning"
          style={{ fontWeight: "600", padding: "10px 30px" }}
        >
          Continue Shopping
        </button>
      </div>
      </div>
    </div>
  );
};

export default OrderDetails;
