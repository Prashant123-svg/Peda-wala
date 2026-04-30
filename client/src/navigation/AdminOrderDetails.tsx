import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderData {
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

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const resolveImageUrl = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("http://localhost:5000/api")) return image.replace("http://localhost:5000/api", API_BASE_URL);
  if (image.startsWith("http://localhost:5000")) return image.replace("http://localhost:5000", API_ORIGIN);
  if (image.startsWith("/")) return `${API_ORIGIN}${image}`;
  return image;
};

const AdminOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrderData();
  }, [orderId, token, navigate]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/orders/admin/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data.order);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.response?.data?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || !newStatus) return;

    setStatusUpdateLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/orders/admin/order-status/${orderId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrder(res.data.order);
      alert("✅ Order status updated successfully");
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/orders/admin/delete-order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Order deleted successfully");
      navigate("/AdminDashboard");
    } catch (err: any) {
      console.error("Error deleting order:", err);
      alert(`Failed to delete order: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewCustomer = () => {
    if (order) {
      navigate(`/admin/customer/${order.userId._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full px-4 mt-5">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || "Order not found"}
          </div>
          <button onClick={() => navigate("/AdminDashboard")} className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusColors: { [key: string]: string } = {
    Pending: "warning",
    Processing: "info",
    Shipped: "primary",
    Delivered: "success",
    Cancelled: "danger",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => navigate("/AdminDashboard")}
                className="px-3 py-1 mb-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                📦 Order Details
              </h1>
              <p className="text-gray-600">Order ID: {order._id.slice(0, 16)}...</p>
            </div>
            <div>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold text-white ${
                order.status === "Pending" ? "bg-yellow-600" :
                order.status === "Processing" ? "bg-blue-600" :
                order.status === "Shipped" ? "bg-blue-700" :
                order.status === "Delivered" ? "bg-green-600" :
                order.status === "Cancelled" ? "bg-red-600" :
                "bg-gray-600"
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer & Status Section */}
          <div>
            {/* Customer Info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  👤 Customer Information
                </h5>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Name</label>
                  <span className="text-gray-800">{order.userId.name}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Email</label>
                  <span className="text-gray-800">{order.userId.email}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Phone</label>
                  <span className="text-gray-800">{order.phoneNumber || "N/A"}</span>
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleViewCustomer}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                  >
                    👤 View Customer Details
                  </button>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-yellow-500 text-gray-900 px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  ✏️ Update Status
                </h5>
              </div>
              <div className="p-6">
                <label htmlFor="status-update" className="block font-bold text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  id="status-update"
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={statusUpdateLoading}
                  title="Update order status"
                >
                  <option value="">Select Status</option>
                  {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {statusUpdateLoading && (
                  <small className="text-blue-600 block mt-2">
                    ⏳ Updating...
                  </small>
                )}
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleteLoading}
                  className="w-full mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                >
                  {deleteLoading ? (
                    <>
                      <span
                        className="inline-block animate-spin mr-2"
                        role="status"
                        aria-hidden="true"
                      >
                        ⟳
                      </span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      🗑️ Delete Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {/* Delivery Address */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-blue-700 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  📍 Delivery Address
                </h5>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-300 rounded p-4 text-gray-800 mb-3">{order.deliveryAddress}</div>
                <small className="text-gray-600">
                  📅 Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </small>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  🛒 Order Items ({order.items.length})
                </h5>
              </div>
              <div className="space-y-0">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 border-b border-gray-200 last:border-b-0">
                    {item.image && (
                      <div className="flex-shrink-0">
                        <img src={resolveImageUrl(item.image)} alt={item.productName} className="w-20 h-20 object-cover rounded" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-700 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  🧾 Order Summary
                </h5>
              </div>
              <div className="p-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Subtotal</span>
                  <strong>₹{order.totalPrice}</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Delivery Charge</span>
                  <strong className="text-green-600">FREE</strong>
                </div>
                <div className="flex justify-between py-3 mt-2 text-lg">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <strong className="text-blue-600">₹{order.totalPrice}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
