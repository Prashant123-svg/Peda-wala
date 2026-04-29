import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface OrderData {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string };
  items: any[];
  totalPrice: number;
  status: string;
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
}

const AdminCustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCustomerData();
  }, [customerId, token, navigate]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users to find the customer
      const usersRes = await axios.get("http://localhost:5000/api/auth/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const foundCustomer = usersRes.data.users.find((u: UserData) => u._id === customerId);
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        setError("Customer not found");
      }

      // Fetch customer's orders
      const ordersRes = await axios.get(
        `http://localhost:5000/api/orders/admin/user-orders/${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(ordersRes.data.orders);
    } catch (err: any) {
      console.error("Error fetching customer data:", err);
      setError(err.response?.data?.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!customer) return;
    
    if (!window.confirm(`Are you sure you want to delete ${customer.name}? All their orders will also be deleted.`)) {
      return;
    }

    setDeleteLoading(customer._id);
    try {
      await axios.delete(`http://localhost:5000/api/auth/admin/user/${customer._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Customer and their orders deleted successfully");
      navigate("/AdminDashboard");
    } catch (err: any) {
      console.error("Error deleting customer:", err);
      alert(`Failed to delete customer: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/order/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full px-4 mt-5">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || "Customer not found"}
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
          <div>
            <button
              onClick={() => navigate("/AdminDashboard")}
              className="px-3 py-1 mb-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              👤 Customer Details
            </h1>
            <p className="text-gray-600">View and manage customer information</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info Card */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  👤 Customer Information
                </h5>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Full Name</label>
                  <span className="text-gray-800">{customer.name}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Email</label>
                  <span className="text-gray-800">{customer.email}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Phone</label>
                  <span className="text-gray-800">{customer.phone || "N/A"}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Address</label>
                  <span className="text-gray-800">{customer.address || "N/A"}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Account Type</label>
                  <span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      customer.role === "admin" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {customer.role === "admin" ? "👑 Admin" : "👤 User"}
                    </span>
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Member Since</label>
                  <span>
                    {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteLoading === customer._id}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                >
                  {deleteLoading === customer._id ? (
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
                      🗑️ Delete Customer & Orders
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h5 className="font-bold text-lg m-0">
                  🚒 Customer Orders ({orders.length})
                </h5>
              </div>
              {orders.length > 0 ? (
                <div className="p-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Order ID</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <small className="text-gray-600">{order._id.slice(0, 12)}...</small>
                          </td>
                          <td className="px-4 py-2">
                            <strong className="text-gray-900">₹{order.totalPrice}</strong>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              statusColors[order.status] === "warning" ? "bg-yellow-100 text-yellow-800" :
                              statusColors[order.status] === "info" ? "bg-blue-100 text-blue-800" :
                              statusColors[order.status] === "primary" ? "bg-blue-100 text-blue-800" :
                              statusColors[order.status] === "success" ? "bg-green-100 text-green-800" :
                              statusColors[order.status] === "danger" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleViewOrder(order._id)}
                              className="px-3 py-1 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded transition-colors"
                              title="View order details"
                            >
                              👁 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                    ℹ️ No orders found for this customer
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetails;
