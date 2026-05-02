import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import RoleRequestApprovals from "./RoleRequestApprovals";
import DeliveryAssignmentPanel from "./DeliveryAssignmentPanel";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  shopName?: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  _id: string;
  userId?: { name: string };
  totalPrice: number;
  status: string;
  createdAt: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const token = localStorage.getItem("token") || "";

  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/profile", {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminProfile(response.data);
    } catch (error) {
      console.error("Error fetching admin profile:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/order-management/admin/all", {
        const response = await axios.get(`${API_BASE_URL}/order-management/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullDashboard = () => {
    window.location.href = "/admin/orders";
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminProfile();
      fetchCustomers();
      fetchOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-semibold">Admin Dashboard</h2>
          <button onClick={onClose} className="text-white text-lg hover:opacity-70">✕</button>
        </div>

    {/* Tabs */}
    <div className="flex gap-2 px-4 py-2 border-b overflow-x-auto bg-gray-50">
      {[
        { key: "profile", label: "Profile" },
        { key: "customers", label: "Customers" },
        { key: "orders", label: "Orders" },
        { key: "roleRequests", label: "Role Requests" },
        { key: "delivery", label: "Delivery" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as any)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
          ${activeTab === tab.key
              ? "bg-blue-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-200"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Profile */}
      {!loading && activeTab === "profile" && adminProfile && (
        <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">👤</div>
            <h3 className="text-xl font-bold">{adminProfile.name}</h3>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
              {adminProfile.role}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <p><strong>Email:</strong> {adminProfile.email}</p>
            {adminProfile.phone && <p><strong>Phone:</strong> {adminProfile.phone}</p>}
            {adminProfile.address && <p><strong>Address:</strong> {adminProfile.address}</p>}
            {adminProfile.shopName && <p><strong>Shop:</strong> {adminProfile.shopName}</p>}
          </div>
        </div>
      )}

      {/* Customers */}
      {!loading && activeTab === "customers" && (
        <div className="grid gap-4 md:grid-cols-2">
          {customers.map((c) => (
            <div key={c._id} className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
              <h4 className="font-semibold">{c.name}</h4>
              <p className="text-sm text-gray-600">{c.email}</p>
              {c.phone && <p className="text-sm mt-1">{c.phone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {!loading && activeTab === "orders" && (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <div key={o._id} className="bg-white p-4 rounded-xl shadow">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{o.userId?.name}</p>
                  <p className="text-sm text-gray-500">₹{o.totalPrice}</p>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full
                  ${o.status === "Delivered" && "bg-green-100 text-green-700"}
                  ${o.status === "Pending" && "bg-yellow-100 text-yellow-700"}
                  ${o.status === "Cancelled" && "bg-red-100 text-red-700"}
                `}>
                  {o.status}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                {new Date(o.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Role */}
      {activeTab === "roleRequests" && <RoleRequestApprovals isVisible />}

      {/* Delivery */}
      {activeTab === "delivery" && <DeliveryAssignmentPanel />}
    </div>

    {/* Footer */}
    <div className="border-t px-4 py-3 flex justify-between bg-white">
      <button
        onClick={fetchOrders}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
      >
        Refresh
      </button>

      <button
        onClick={handleViewFullDashboard}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
      >
        Full Dashboard →
      </button>
    </div>

  </div>
</div>
  );
};

export default AdminPanel;